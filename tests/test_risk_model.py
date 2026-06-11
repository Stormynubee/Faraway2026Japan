from server.agents.risk_model import load_risk_model, predict_priority, train_and_save


def test_risk_model_predicts_p1_for_high_risk_inputs():
    train_and_save()
    model = load_risk_model()
    label = model.predict([[0.9, 0.85, 4.5]])[0]
    assert label == "P1"


def test_predict_priority_api():
    train_and_save()
    assert predict_priority(0.9, 0.85, 4.5) == "P1"
    assert predict_priority(0.1, 0.1, 0.5) == "OK"
