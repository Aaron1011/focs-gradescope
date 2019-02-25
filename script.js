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

    function injectCalculator(ungradedEntries) {
        var section = $("section");
        var wrapperDiv = $("<div id='focs-grade-calculator-tampermonkey'>")
        var title = $("<h2><br/><br/>FOCS Grade calculator script</h2>");

        wrapperDiv.append(title);

        for (var i = 0; i < ungradedEntries.length; i++) {
            (function(i) {
                var entry = ungradedEntries[i];
                var sliderWrapper = $("<div>", {id: "focs-grade-calculator-tampermonkey-homework-slider-wrapper-" + entry.name});

                var sliderName = "focs-grade-calculator-tampermonkey-homework-slider-" + entry.name;


                var sliderLabel = $('<label />', {for: sliderName});
                sliderLabel.text(entry.name + " score:");
                var sliderVal = $('<input type="text" value="80" style="width: 40px"/>');

                var slider = $('<input type="range" min="0" max="100" value="80" />', {name: sliderName});
                slider[0].addEventListener('input', function() {
                    sliderVal.val(slider[0].value);
                });

                sliderVal[0].addEventListener('input', function() {
                    slider.val(sliderVal[0].value);
                })

                sliderWrapper.append(sliderLabel);
                sliderWrapper.append(sliderVal);
                sliderWrapper.append(slider);

                wrapperDiv.append(sliderWrapper);
            })(i);
        }

        section.append(wrapperDiv);
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

    var ungraded = [];
    // There are eight homeworks total
    for (var j = numHomeworks + 1; j <= 8; j++) {
        ungraded.push({name: "Homework " + j});
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


    injectCalculator(ungraded);

    // Your code here...
})();

