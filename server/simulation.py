# server/simulation.py
class SimulationEngine:
    def __init__(self, on_event=None):
        self.on_event = on_event
        self.segments = {}
    def tick(self):
        pass

# added train progress
