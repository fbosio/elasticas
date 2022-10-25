# elasticas
Web application for calculating velocities of elastic waves in solids.

Currently hosted in http://fbosio.pythonanywhere.com/


## Get source code
Clone the repository using for example HTTPS
```bash
git clone https://github.com/fbosio/elasticas.git
```
you can also clone it using SSH or Github CLI, or downloading the ZIP as usual.

If you're on Windows and you don't have git installed, take a look at [git for windows](https://gitforwindows.org/).

## Prepare environment
Command syntax differs a little bit from one operating system to another but the underlying idea is always the same.

1. Make sure you're in the application folder.
2. Create a virtual environment.
3. Activate the virtual environment.
4. Install requirements.

### Example: Ubuntu
```bash
cd elasticas  # assuming you just cloned the repository
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Similar commands work on Windows from a Powershell, you just probably have to change `python3` to `py` and `source .venv/bin/activate` to `.venv/Scripts/activate/`.
Make sure you have a proper [execution policy](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies).

## Run locally
Make sure the virtual enviroment is activated and then
```bash
flask run
```
A local address like `http://127.0.0.1:5000` should be displayed, go there with your browser and you will see the web application.

