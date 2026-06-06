from server.agents.hydrology import HydrologyAgent


def test_description_reports_stiffness_as_pct_of_nominal():
    agent = HydrologyAgent()
    result = agent.evaluate(rainfall=0.9, soil_moisture=0.85, nominal_stiffness=100.0)
    assert "64.8% of nominal" in result["description"]
    assert "88.0%" in result["description"]


def test_critical_state_at_high_risk():
    agent = HydrologyAgent()
    result = agent.evaluate(rainfall=0.9, soil_moisture=0.85)
    assert result["state"] == "CRITICAL_MUD_PUMPING"
