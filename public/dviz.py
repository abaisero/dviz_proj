import numpy as np

def p(proj):
    #  project, homework, quiz, in-class participation, reading discussion

    grad = [None,   1,   .8333,  1,      .8222]
    perc = [.4,     .3,     .15,    .075,   .075]

    if proj is not None:
        grad[0] = 1.1 * proj

    n = sum(g * p for g, p in zip(grad, perc) if g is not None)
    d = sum(p for g, p in zip(grad, perc) if g is not None)
    return n / d

for proj in np.linspace(.5, 1, 51):
    print(proj, '\t', p(proj))
