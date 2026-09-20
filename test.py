import torch
from sentence_transformers import SentenceTransformer
import chromadb

print("PyTorch version:", torch.__version__)
print("GPU available:", torch.cuda.is_available())

model = SentenceTransformer('all-MiniLM-L6-v2')
print("Sentence transformer loaded ✅")
