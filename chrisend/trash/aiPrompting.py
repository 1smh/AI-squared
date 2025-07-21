import requests
import json
#testkey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg2MjM0YjY1LTIxNDktNGNmMC04M2I4LTA3OTYzYWQ5NGRlYiIsInR5cGUiOiJpZV9tb2RlbCJ9.Hr8VnJ7UYwtWk13RQ3XC1UuRRST3uAqomV1SRgFCBnw"
url = "https://api.gmi-serving.com/v1/chat/completions"
model = "Qwen/Qwen3-235B-A22B-FP8"
def get_response(context, prompt):
    print("requesting ai")
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + testkey
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": context},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0,
        "max_tokens": 500
    }

    response = requests.post(url, headers=headers, json=payload)
    #print(json.dumps(response.json(), indent=2))
    print(response.json().get("choices", [{}])[0].get("message", {}).get("content"))
    print("request complete")
    return response.json().get("choices", [{}])[0].get("message", {}).get