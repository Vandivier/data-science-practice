import json
from pprint import pprint
import requests

def main():
    sCacheUrl = 'https://raw.githubusercontent.com/Vandivier/udacity-apify/master/kv-store-dev/OUTPUT'

    response = requests.get(sCacheUrl)
    s = response.text
    data = json.loads(s)

    # a touple is a list of lists. An n-tuple is a sequence (or ordered list) of n elements. 2tpl is a 2 touple
    # ref: https://stackoverflow.com/questions/1679384/converting-python-dictionary-to-list
    tpl2People = data['people'].items()

    # list comprehension > lambda + filter as readability best practice
    # ref: https://stackoverflow.com/questions/3013449/list-filtering-list-comprehension-vs-lambda-filter
    listoEmploymentMeasured = [v for k,v in tpl2People if 'bPresentlyEmployed' in v]
    listoEmployed = [o for o in listoEmploymentMeasured if o['bPresentlyEmployed'] == True]
    iPercentEmployed = len(listoEmployed) / len(listoEmploymentMeasured)

    pprint("Percent employed: " + str(iPercentEmployed))
    pprint("Note: percent employed is comparable to an age-nonadjusted employment-population ratio.") # ref: https://data.bls.gov/timeseries/LNS12300000
    pprint("Sample size with employment data: " + str(len(listoEmploymentMeasured)))
    pprint("Total sample size: " + str(len(tpl2People)))
    pprint("Percent of observations with employment data: " + str(len(listoEmploymentMeasured) / len(tpl2People)))

main()
