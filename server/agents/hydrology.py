# server/agents/hydrology.py

class HydrologyAgent:
    def __init__(self, alpha=0.6, beta=0.4, stiffness_degradation_factor=0.4):
        """
        Fuses rainfall intensity and soil moisture to compute track subgrade risk.
        
        Formula:
        H_i = alpha * Rainfall + beta * Soil Moisture
        k_effective = k0 * (1 - stiffness_degradation_factor * H_i)
        """
        self.alpha = alpha
        self.beta = beta
        self.degradation_factor = stiffness_degradation_factor

    def evaluate(self, rainfall: float, soil_moisture: float, nominal_stiffness: float = 100.0) -> dict:
        """
        rainfall: normalised [0.0, 1.0] representing rainfall rate (up to 50mm/h)
        soil_moisture: normalised [0.0, 1.0] representing volumetric water content
        """
        # Calculate Risk Index
        risk_index = (self.alpha * rainfall) + (self.beta * soil_moisture)
        risk_index = max(0.0, min(1.0, risk_index))
        
        # Calculate effective stiffness degradation
        k_effective = nominal_stiffness * (1.0 - (self.degradation_factor * risk_index))
        
        # Risk classification
        if risk_index < 0.35:
            state = "HEALTHY"
        elif risk_index < 0.70:
            state = "WARNING_WATERLOGGING"
        else:
            state = "CRITICAL_MUD_PUMPING"

        stiffness_pct = round((k_effective / nominal_stiffness) * 100, 1)
        return {
            "risk_index": round(risk_index, 3),
            "k_effective": round(k_effective, 2),
            "effective_stiffness": round(k_effective, 2),
            "state": state,
            "description": (
                f"Hydrology index {round(risk_index * 100, 1)}%. "
                f"Effective stiffness at {stiffness_pct}% of nominal."
            ),
        }
