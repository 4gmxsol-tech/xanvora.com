# Xanvora-V0 Dataset Factory

Raw videos are intentionally kept outside Git.

Recommended research sources include OpenVid-1M and other datasets whose licenses/terms permit the intended use. OpenVid-1M contains about 1M curated text-video clips and provides metadata/download tooling. Verify the current dataset terms before downloading or training. citehttps://github.com/NJU-PCALab/OpenVid-1M

For a first experiment, build a small local subset before scaling.

Expected local layout:

data/
  raw/
  clips/
  manifest.jsonl
  train.jsonl
  val.jsonl

Each manifest row:

{"video":"clips/example.mp4","caption":"a humanoid robot walking in a warehouse"}

Use:
python prepare_dataset.py --input-csv data/raw/OpenVid-1M.csv --video-root data/raw/video --output data/manifest.jsonl

Then:
python split_manifest.py --input data/manifest.jsonl --train data/train.jsonl --val data/val.jsonl
