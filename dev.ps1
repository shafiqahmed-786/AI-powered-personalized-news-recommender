# dev.ps1 - Development helper for Windows (PowerShell / Anaconda Prompt)
param(
  [string]$EnvName = "newsrec_clean",
  [switch]$Resume
)

function Ensure-Conda {
  if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
    Write-Error "conda not found in PATH. Open Anaconda Prompt."
    exit 1
  }
}

Ensure-Conda

if (-not $Resume) {
    Write-Host "1) Creating conda environment (if not exists)..."
    $exists = conda env list | Select-String $EnvName
    if (-not $exists) {
      conda create -n $EnvName -c conda-forge -c pytorch python=3.10 sentence-transformers=2.2.2 faiss-cpu numpy -y
    } else {
      Write-Host "Environment '$EnvName' already exists."
    }

    Write-Host "`n2) Activate the environment:"
    Write-Host "`tconda activate $EnvName"
    Write-Host "`nThen run:`n`t.\dev.ps1 -Resume"
    exit
}

# Resume mode: install pip deps
Write-Host "`nInstalling pip packages..."
python -m pip install Flask==2.2.5 pandas==2.0.3 pymongo==4.4.0 python-dotenv==1.0.0 gunicorn==20.1.0 --no-warn-script-location

Write-Host "`nVerifying..."
python -c "import sys, sentence_transformers, transformers, huggingface_hub, faiss, numpy; print('PY',sys.version.split()[0],'ST',sentence_transformers.__version__,'HFH',huggingface_hub.__version__,'FAISS',faiss.__version__,'NP',numpy.__version__,'EXE',sys.executable)"

Write-Host "`nRun the app with:`n  python app\main.py"
