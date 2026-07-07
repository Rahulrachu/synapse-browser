
import os
import sys
from openai import OpenAI

# Ensure API key is available
api_key = os.getenv("OPENAI_API_KEY")
api_base = os.getenv("OPENAI_API_BASE")

if not api_key or not api_base:
    print("Error: OPENAI_API_KEY or OPENAI_API_BASE environment variable not set.", file=sys.stderr)
    sys.exit(1)

client = OpenAI(api_key=api_key, base_url=api_base)

def generate_embedding(text):
    try:
        response = client.embeddings.create(
            model="text-embedding-ada-002", # Or another suitable embedding model
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_embedding.py \"Your text here\"", file=sys.stderr)
        sys.exit(1)
    
    input_text = sys.argv[1]
    embedding = generate_embedding(input_text)
    if embedding:
        print(embedding)
