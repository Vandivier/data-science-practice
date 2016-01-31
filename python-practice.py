from __future__ import division
from fractions import Fraction
import numpy as np
import urllib.request
import json
import scipy
import scipy.optimize as optimize
#from scipy.optimize import fsolve
#import sympy
from sympy import *
from sys import modules

if not modules['sympy']:
	print('module load error')

'''
#https://www.quandl.com/api/v1/datasets/BAVERAGE/USD.json?rows=300
#other cool thing... https://www.quandl.com/data/ODA/USA_NGDP_R-United-States-GDP-at-Constant-Prices-LCU-Billions
print('\nTrying a time series forecast of bitcoin price based on Quandl data with n = 300.\n')

resp = urllib.request.urlopen('https://www.quandl.com/api/v1/datasets/BAVERAGE/USD.json?rows=300')
str_response = resp.readall().decode('utf-8')

dataObj = json.loads(str_response)
print(dataObj['id'])
'''

#http://docs.scipy.org/doc/scipy/reference/tutorial/integrate.html
#http://live.sympy.org/

x, y, z, t, K, L, lmbda = symbols('x y z t K L lmbda')

exp1 = 1/2*K**(-3/4)*L**(3/4)
exp2 = 30/2*K**(1/4)*L**(-1/4)
result = exp1/exp2

print('\n')
print('first we print the relationship between L and K (printed expression === 1)...')
print(result) #L = 30K
print('\n')

#only partly sure wtf i am doing but this should return [K,L,lmbda] which minimize the derivative of the lagrangian
#that is, argument values such that lagrangianPrime = 0
def lagrangianPrime(args):
    K = args[0]
    L = args[1]
    lmbda = args[2]
    return 3/2*K**(1/4)*L**(-1/4)-lmbda

next = optimize.fmin(lagrangianPrime, [10,20,5])
print('about to print lagrangianPrime vals...')
print(next)
print('\n')

shadowPrice = 3/2*(250)**(1/4)*(7500)**(-1/4)
print('On the next line we print lambda (aka shadowPrice)...')
print(shadowPrice)