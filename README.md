# vesselfinder-scrape

Use puppeteer to connect to vesselfinder.com and focus on the map element

## TODO

- [ ] Add refreshing on a cycle
- [ ] Speed up loading time
  - [ ] Try using playwright instead
  - [ ] block ads
- [ ] test out reliability over long runs

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
SCREEN_WIDTH=1920
SCREEN_WIDTH=1080
# set RPI to true if you're running on the RPI, blank or false otherwise.
RPI=false
```

6. run the script

```console
yarn scrape
```
