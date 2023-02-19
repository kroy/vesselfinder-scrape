# vesselfinder-scrape

Use puppeteer to connect to vesselfinder.com and focus on the map element

## Setup

1. Install node 19 and npm: https://nodejs.org/en/download/current/
2. [Install/activate yarn](https://yarnpkg.com/getting-started/install)

```console
corepack enable
corepack prepare yarn@stable --activate
```

3. Install git and use git to clone this repo into a directory on your computer
4. In a terminal, navigate to the home of this repository on your computer and install dependencies with:

```console
cd path/to/the/directory/you/cloned/into
yarn
```

5. Create a file called `.env` in the same directory as your project with the following values filled in:

```.env
USERNAME=
PASSWORD=
# set RPI to true if you're running on the RPI, blank or false otherwise.
RPI=
```

5. run the script

```console
yarn scrape
```
