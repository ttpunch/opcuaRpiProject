import abc
import random
import math
import time
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

try:
    import RPi.GPIO as GPIO
    HAS_GPIO = True
except (ImportError, RuntimeError):
    HAS_GPIO = False
    _logger.warning("RPi.GPIO not found. GPIO sources will be mocked.")

if HAS_GPIO:
    try:
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BCM)
    except Exception as e:
        _logger.error(f"Failed to initialize GPIO: {e}")


# ADS1115 Imports
try:
    import board
    import busio
    import adafruit_ads1x15.ads1115 as ADS
    from adafruit_ads1x15.analog_in import AnalogIn
    HAS_ADS1115_LIB = True
except (ImportError, RuntimeError, NotImplementedError):
    HAS_ADS1115_LIB = False
    _logger.warning("ADS1115 libraries not found or compatible. ADS sources will be mocked.")

# MCP3008 Imports
try:
    import board
    import busio
    import digitalio
    import adafruit_mcp3xxx.mcp3008 as MCP
    from adafruit_mcp3xxx.analog_in import AnalogIn as MCPAnalogIn
    HAS_MCP3008_LIB = True
except (ImportError, RuntimeError, NotImplementedError):
    HAS_MCP3008_LIB = False
    _logger.warning("MCP3008 libraries not found or compatible. MCP sources will be mocked.")

class DataSource(abc.ABC):
    def __init__(self, config):
        self.config = config
        self.name = config.get("name")
        self.error = None

    @abc.abstractmethod
    async def read(self):
        pass

    @abc.abstractmethod
    async def write(self, value):
        pass

class SimulationSource(DataSource):
    def __init__(self, config):
        super().__init__(config)
        self.sim_type = config.get("sim_type", "random") # random, sine, incremental
        self.min_val = config.get("min", 0.0)
        self.max_val = config.get("max", 100.0)
        self.step = config.get("step", 1.0)
        self.current_val = self.min_val
        self.start_time = time.time()

    async def read(self):
        if self.sim_type == "random":
            return random.uniform(self.min_val, self.max_val)
        elif self.sim_type == "sine":
            # Sine wave based on time
            elapsed = time.time() - self.start_time
            amplitude = (self.max_val - self.min_val) / 2
            center = self.min_val + amplitude
            return center + amplitude * math.sin(elapsed)
        elif self.sim_type == "incremental":
            self.current_val += self.step
            if self.current_val > self.max_val:
                self.current_val = self.min_val
            return self.current_val
        return 0.0

    async def write(self, value):
        _logger.info(f"Simulation source {self.name} is read-only. Write ignored.")

class GPIOSource(DataSource):
    def __init__(self, config):
        super().__init__(config)
        self.pin = config.get("pin")
        self.mode = config.get("mode", "input") # input or output
        
        if HAS_GPIO:
            try:
                if self.mode == "input":
                    # robust: use Pull Down so unconnected pins read 0 (False) instead of floating
                    GPIO.setup(self.pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
                else:
                    GPIO.setup(self.pin, GPIO.OUT)
                
                _logger.info(f"Successfully setup GPIO pin {self.pin} as {self.mode}")
            except Exception as e:
                self.error = str(e)
                _logger.error(f"Error setting up GPIO pin {self.pin}: {e}")
        else:
            self.error = "RPi.GPIO not available (running in mock mode)"
    async def read(self):
        if self.error and not HAS_GPIO: # If mock mode but we have an error string
             # We should probably still return something for the OPC UA node
             # but we can log that it's in a fault state.
             pass

        if HAS_GPIO:
            try:
                return GPIO.input(self.pin)
            except Exception as e:
                self.error = str(e)
                return None # None will indicate "Red" in the UI
        else:
            # If no GPIO, return 0 by default but keep error set
            return 0

    async def write(self, value):
        if self.mode == "output":
            if HAS_GPIO:
                try:
                    GPIO.output(self.pin, 1 if value else 0)
                    self.error = None
                except Exception as e:
                    self.error = str(e)
            else:
                _logger.error(f"Cannot write to GPIO pin {self.pin}: RPi.GPIO not available.")
        else:
            _logger.warning(f"GPIO Pin {self.pin} is configured as input. Cannot write.")

class ManualSource(DataSource):
    def __init__(self, config):
        super().__init__(config)
        self.value = config.get("initial_value", 0.0)

    async def read(self):
        return self.value

    async def write(self, value):
        self.value = value
        _logger.info(f"Manual source {self.name} updated to {value}")

class ADS1115Source(DataSource):
    def __init__(self, config):
        super().__init__(config)
        self.channel = config.get("channel", 0)
        self.gain = config.get("gain", 1)
        self.i2c_addr = config.get("i2c_address", 0x48)
        self.mock_val = 0.0
        
        if HAS_ADS1115_LIB:
            try:
                # Initialize I2C bus
                self.i2c = busio.I2C(board.SCL, board.SDA)
                self.ads = ADS.ADS1115(self.i2c, address=self.i2c_addr, gain=self.gain)
                self.chan = AnalogIn(self.ads, getattr(ADS, f"P{self.channel}"))
                _logger.info(f"Initialized ADS1115 Channel {self.channel} at {hex(self.i2c_addr)}")
            except Exception as e:
                self.error = str(e)
                _logger.error(f"Failed to initialize ADS1115: {e}")
        else:
            self.error = "ADS1115 Library Missing (Mock Mode)"

    async def read(self):
        if HAS_ADS1115_LIB and not self.error:
            try:
                return self.chan.voltage
            except Exception as e:
                self.error = str(e)
                return 0.0
        else:
            # Mock behavior: Random voltage between 0-3.3V
            return random.uniform(0.0, 3.3)

    async def write(self, value):
        _logger.warning("Cannot write to ADC (Read Only)")

class MCP3008Source(DataSource):
    def __init__(self, config):
        super().__init__(config)
        self.channel = config.get("channel", 0)
        self.cs_pin = config.get("cs_pin", 8) # CE0 defaults to GPIO 8
        self.mock_val = 0.0
        
        if HAS_MCP3008_LIB:
            try:
                # Initialize SPI bus
                self.spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)
                self.cs = digitalio.DigitalInOut(getattr(board, f"D{self.cs_pin}"))
                self.mcp = MCP.MCP3008(self.spi, self.cs)
                self.chan = MCPAnalogIn(self.mcp, getattr(MCP, f"P{self.channel}"))
                _logger.info(f"Initialized MCP3008 Channel {self.channel} with CS pin {self.cs_pin}")
            except Exception as e:
                self.error = str(e)
                _logger.error(f"Failed to initialize MCP3008: {e}")
        else:
            self.error = "MCP3008 Library Missing (Mock Mode)"

    async def read(self):
        if HAS_MCP3008_LIB and not self.error:
            try:
                return self.chan.voltage
            except Exception as e:
                self.error = str(e)
                return 0.0
        else:
            # Mock behavior: Random voltage between 0-3.3V
            return random.uniform(0.0, 3.3)

    async def write(self, value):
         _logger.warning("Cannot write to ADC (Read Only)")


class SourceFactory:
    @staticmethod
    def create(config):
        stype = config.get("type")
        if stype == "simulation":
            return SimulationSource(config)
        elif stype == "gpio":
            return GPIOSource(config)
        elif stype == "manual":
            return ManualSource(config)
        elif stype == "ads1115":
            return ADS1115Source(config)
        elif stype == "mcp3008":
            return MCP3008Source(config)
        else:
            raise ValueError(f"Unknown source type: {stype}")
