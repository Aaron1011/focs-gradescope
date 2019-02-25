// ==UserScript==
// @name         FOCS Grade Calculator
// @namespace    https://aaron1011.pw
// @version      0.1
// @description  Calculate your FOCS grade on gradescope
// @author       Aaron1011
// @match        https://www.gradescope.com/courses/35880
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function percentToLetter(percent) {
        percent = Math.round(percent * 100);
        // Each list item is of the form [minimum score, letter grade]
        var table = [[93, "A"], [90, "A-"], [87, "B+"], [83, "B"], [80, "B-"], [77, "C+"], [73, "C"], [70, "C-"], [67, "D+"], [60, "D"], [0, "F"]];
        for (var i = 0; i < table.length; i++) {
            if (percent >= table[i][0]) {
                return table[i][1];
            }
        }
        throw new Error("Impossible case reached for percent " + percent);
    }

    var assignments = $("tbody tr");
    var homeworkTotal = 0;
    var numHomeworks = 0;
    var exam1 = -1;
    var exam2 = -1;
    var final = -1;
    for (var i = 0; i < assignments.length; i++) {
        var assignment = $(assignments[i]);
        var name = assignment.find(".table--primaryLink").text();
        var score = assignment.find(".submissionStatus--score").text();
        var scoreFrac = "<No Score>";

        if (score !== "") {
            var split = score.split("/");
            scoreFrac = parseFloat(split[0]) / parseFloat(split[1]);
            if (name.startsWith("Homework")) {
                homeworkTotal += scoreFrac;
                numHomeworks++;
            } else if (name.startsWith("Exam 1")) {
                exam1 = scoreFrac;
            } else if (name.startsWith("Exam 2")) {
                exam2 = scoreFrac;
            }
        }

        console.log("Assignment: " + name);
        console.log("Score: " + scoreFrac);
    }

    if (exam2 == -1) {
        console.error("Exam 2 has not been graded! Using exam 1 score of " + exam1 + " for exam 2 score");
        exam2 = exam1;
    }
    if (final == -1) {
        console.error("Final exam has not been graded! Using exam 2 score of " + exam2 + " for final exam score");
        final = exam2;
    }

    // https://www.cs.rpi.edu/~pattes3/csci2200/general-info-2019.pdf
    var total = (0.2 * (homeworkTotal / numHomeworks)) + (0.25 * exam1) + (0.25 * exam2) + (0.3 * final);
    var letter = percentToLetter(total);
    console.log("Your current overall score: " + total + " with letter grade " + letter);

    // Your code here...
})();
