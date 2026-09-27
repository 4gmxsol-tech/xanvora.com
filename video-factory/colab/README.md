# Free GPU Runner

Xanvora Video Factory includes a Colab notebook for real Wan2GP generation on a free GPU runtime.

Notebook:
`colab/xanvora-free-gpu.ipynb`

Target workflow:

```
Xanvora prompt
   ↓
Colab GPU session
   ↓
Wan2GP Python API
   ↓
MP4
```

## Why this mode

Google Colab provides free GPU access, but free resources are dynamic and not guaranteed. Google also restricts using free managed runtimes as persistent web services/workers. Therefore this runner performs generation interactively inside the notebook rather than exposing a permanent public API.

For low-VRAM free runtimes, start with a short 480p generation and the Wan2GP Profile 4 configuration.

The notebook discovers a compatible FastWan video model at runtime, then submits the generation through Wan2GP's official Python API.
