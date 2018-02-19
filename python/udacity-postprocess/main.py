import json
from pprint import pprint
import requests

def main():
    sCacheUrl = 'https://raw.githubusercontent.com/Vandivier/udacity-apify/master/kv-store-dev/OUTPUT'

    response = requests.get(sCacheUrl)
    s = response.text
    data = json.loads(s)
    listoPeople = data['people']

    # list comprehension > lambda + filter as readability best practice
    # ref: https://stackoverflow.com/questions/3013449/list-filtering-list-comprehension-vs-lambda-filter
    #listoEmploymentMeasured = [o for o in listoPeople if hasattr(o, 'bPresentlyEmployed')]
    listoEmploymentMeasured = [o for o in listoPeople if True]
    #listoEmployed = [o for o in listoEmploymentMeasured if o['bPresentlyEmployed'] == True]
    listoEmployed = [o for o in listoEmploymentMeasured if False]
    iPercentEmployed = len(listoEmployed) / len(listoEmploymentMeasured)

    pprint(iPercentEmployed)

main()
