/*
http://demonstrations.wolfram.com/
port to mathematica when able...
////////////////////////////////////

kdot[t_] = y - c[t] - (n + g + d)k[t]
y = k^a
(* a = 1/3 *)
k[t] = ys - (n + g + d)k[t]
r[t] = y'[k]

</mathematicaStuff>
*/
function ramseyCassKoopmans() {
//https://en.wikipedia.org/wiki/Ramsey%E2%80%93Cass%E2%80%93Koopmans_model
//we assume cobb-douglass type F(K,AL) with inada conditions among other facts.
var a,b,c,C,d,g,k,K,r,R,s,y,Y;

a = 1/3;
b = (1-a);
Y = (K^a)((AL)^b);
k = K/AL;
y = k^a;
//dk_dt === dk/dt; dk_dt called 'law of motion of capital accumulation'
dk_dt = y - c - (n + g + d)k;
I = sY = (1-c)Y;
R = ak^(a-1);
r = rho_DiscountRate - gc;
growth(c)
}

growthRate(k) = dot(k) = derivative(k,t)/k;

function derivative(of,withRespectTo) {
	
}

function inTermsOf (x, y) {
	//if possible, express x in terms of y
	//if they are independant, declare the independance
	//if they are unexpressably or indeterminably related, return error
	//mayb x = 2, y = 4, return x in terms of y => x = y/2
}

/*
to do: add support for abstract returns "5b", and so on
to do: add support for function-variables (f = f(k) = a function of k, but act like it's a var)
*/
//we need to copy this bro: http://www.integral-calculator.com/
//requires jquery
//indefinite variables in JS
var abstractjs = {variables : []};
var ajs = abstractjs;

/* two ways to declare an abstract variable.
1: ajs.addVar('myNewVariable');
//to do: add support for option 2
2: ajs.addVar('csv,string,array,of,variable,names');
3: ajs.addVar(['array','of','variable','strings']);
*/
ajs.addVar = new function(params) {
	if(typeof params === "string") {
		if($.inArray(params, abstractjs.variables) === -1) {
			abstractjs.variables[params] = params;
		}
	} else if (Array.isArray(params)) {
		for (i=0; i < params.length; i++) {
			//to do: make sure i am actually skipping bad members
			if(typeof params[i] !== "string") {
				console.log('Error: ajs.capture failed to execute. Array passed for capture contains invalid member(s).');
			} else {
				abstractjs.variables[params[i]] = params[i];
			}
		}
	} else {
		console.log('Error: ajs.capture failed to execute. Parameter passed for capture is neither string nor string array.');
	}
}

ajs.capture('a');
ajs.capture([b,k]);