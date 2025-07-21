import threading
import requests
import json


question = "what is the capital of France?"
# if you see this key enjoy the credits
#testkey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg2MjM0YjY1LTIxNDktNGNmMC04M2I4LTA3OTYzYWQ5NGRlYiIsInR5cGUiOiJpZV9tb2RlbCJ9.Hr8VnJ7UYwtWk13RQ3XC1UuRRST3uAqomV1SRgFCBnw"
url = "https://api.gmi-serving.com/v1/chat/completions"
model = "Qwen/Qwen3-235B-A22B-FP8"
aiAnswers = []

aiAgents = [
    {   "name": "1 word response",
        "messages" : [
            {"role": "system", "content": "respond to this question with 1 word"}, 
            {"role": "user", "content": question}],
        "temperature": 0,
        "top_p": 1,
        "top_k": 1       
    },
    {   "name": "2 word response",
        "messages" : [
            {"role": "system", "content": "respond to this question with 2 words"}, 
            {"role": "user", "content": question}],
        "temperature": 0,
        "top_p": 1,
        "top_k": 1       
    },
    {   "name": "1 sentence response",
        "messages" : [
            {"role": "system", "content": "respond to this question with 1 sentence"}, 
            {"role": "user", "content": question}],
        "temperature": 0,
        "top_p": 1,
        "top_k": 1       
    },
]

def get_response(aiAgent):
    print("requesting ai")
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + testkey
    }

    payload = {
        "model": model,
        "messages": aiAgent["messages"],
        "temperature": aiAgent["temperature"],
        "top_p": aiAgent["top_p"],
        "top_k": aiAgent["top_k"],
        "max_tokens": 500
    }

    response = requests.post(url, headers=headers, json=payload)
    answer = {
        "name": aiAgent["name"], 
        "response": response.json().get("choices", [{}])[0].get("message", {}).get("content")
    }
    aiAnswers.append(answer)
    #print(json.dumps(response.json(), indent=2))
    print(response.json().get("choices", [{}])[0].get("message", {}).get("content"))
    print("request complete")
    return response.json().get("choices", [{}])[0].get("message", {}).get



# Start threads for each link
threads = []
for aiAgent in aiAgents:
    # Using `args` to pass positional arguments and `kwargs` for keyword arguments
    t = threading.Thread(target=get_response, args=(aiAgent,))
    threads.append(t)
print(aiAnswers)
# Start each thread
for t in threads:
    t.start()

# Wait for all threads to finish
for t in threads:
    t.join()
    
print(aiAnswers)
