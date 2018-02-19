#const sCacheUrl = 'https://raw.githubusercontent.com/Vandivier/udacity-apify/master/kv-store-dev/OUTPUT';

import json
from pprint import pprint
import requests

sUrl = 'https://raw.githubusercontent.com/Vandivier/udacity-apify/master/kv-store-dev/OUTPUT'

r = requests.get(sUrl)
#data = json.load(open('data.json'))
#data = json.load(r.json())

pprint(r.json())
