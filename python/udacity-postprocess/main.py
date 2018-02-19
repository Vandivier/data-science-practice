import json
from pprint import pprint
import requests

sCacheUrl = 'https://raw.githubusercontent.com/Vandivier/udacity-apify/master/kv-store-dev/OUTPUT'

response = requests.get(sCacheUrl)
data = json.load(response.json())

pprint(data['proxies'])
