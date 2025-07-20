import threading
import aiPrompting

question = "what is the capital of France?"

aiPrompts = [
    {"context" : "respond to this question with 1 word", 
     "prompt" : question},
     {"context" : "respond to this question with 2 words", 
     "prompt" : question},
     {"context" : "respond to this question with 3 words", 
     "prompt" : question},
]

# Start threads for each link
threads = []
for prompt in aiPrompts:
    # Using `args` to pass positional arguments and `kwargs` for keyword arguments
    t = threading.Thread(target=aiPrompting.get_response, args=(prompt["context"], prompt["prompt"]))
    threads.append(t)

# Start each thread
for t in threads:
    t.start()

# Wait for all threads to finish
for t in threads:
    t.join()