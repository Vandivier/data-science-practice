# Udacity-Python

Scraping Udacity user data with IP Rotation in Python.

White hat stuff only. This is for research.

Also, this is how I'm learning Python. So this readme contains a ton of links both directly relevant to the project and also generally connected to learning Python.

Note that this is related to some other projects:

1. vandivier / data-science-practice / js / udacity-study       is the origin
2. vandivier / udacity-apify                                    is mature and working, but no IP rotation
3. vandivier / data-science-practice / python / udacity-python  the latest member of the family, more a learning project than a mature useful thing

Built with Yeoman's [`generator-python-lib`](https://gitlab.com/hyper-expanse/generator-python-lib/tree/master).

# Making it work?

Make sure you have PATH / env var set where python3 is key and Python executable is value, then:

`virtualenv --python="$python3" venv`

At least, that's what I ran in git bash on Windows 10.

Or, if you can't set env vars, you can just use the python3 path in-place above.

After you see "Installing setuptools, pip, wheel...done", there should be a generated `venv` folder. Then:

`source ./venv/bin/activate`

Notice that the above doesn't work on Windows 10 (at least w Git Bash or Cygwin). See [this issue](https://github.com/pypa/virtualenv/issues/1132) for info.

So now, from the root folder of the project (the folder containing this README) run:

`cd udacity-python`
`py __init__.py`

It should work!


# Relevant Links

1. [add youtube link to live learning vid when ready]
2. http://notesfromthelifeboat.com/post/python-project/
3. http://pyscaffold.org/en/latest/features.html
4. https://stackoverflow.com/questions/33751214/single-command-in-python-to-install-relevant-modules-from-a-package-json-like-fi
5. https://stackoverflow.com/questions/46138803/virtualenv-on-windows10-gives-errorthe-path-python3-does-not-exist
6. https://stackoverflow.com/questions/30846891/python-should-i-check-the-virtualenv-code-into-git
7. https://github.com/pypa/virtualenv/issues/1132
