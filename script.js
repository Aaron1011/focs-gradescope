// ==UserScript==
// @name         FOCS Grade Calculator
// @namespace    https://aaron1011.pw
// @version      0.1.4
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

    function calculate(homeworkAvg, exam1, exam2, final) {
        // https://www.cs.rpi.edu/~pattes3/csci2200/general-info-2019.pdf
        var total = (0.2 * (homeworkAvg)) + (0.25 * exam1) + (0.25 * exam2) + (0.3 * final);
        var letter = percentToLetter(total);
        return {
            total: total,
            letter: letter
        }
    }


    function injectCalculator(data) {
        var section = document.querySelector("section");
        var wrapperDiv = document.createElement("div");
        wrapperDiv.setAttribute("id", "focs-grade-calculator-tampermonkey");
        var title = document.createElement("h2");

        // Add two line breaks
        title.appendChild(document.createElement("br"));
        title.appendChild(document.createElement("br"));

        title.textContent = "FOCS Grade calculator script";

        var formula = document.createElement("p");
        formula.innerHTML = "Formula: ((0.2 * HW) + (.25 * Exam1) + (.25 * Exam2) + (.30 * FinalExam)) [from <a href='https://www.cs.rpi.edu/~pattes3/csci2200/general-info-2019.pdf'>https://www.cs.rpi.edu/~pattes3/csci2200/general-info-2019.pdf</a>]";

        title.appendChild(formula);

        var finalGrade = document.createElement("p");
        var finalGradeLetter = document.createElement("p");
        wrapperDiv.appendChild(title);

        var homeworkValues = [];
        var exam1 = data.exam1;
        var exam2 = data.exam2;
        var final = data.final;

        function recalculate() {
            var newHomeworkTotal = data.homeworkTotal;
            for (var i = 0; i < homeworkValues.length; i++) {
                newHomeworkTotal += homeworkValues[i];
            }

            var homeworkAvg = newHomeworkTotal / (data.numHomeworks + homeworkValues.length);
            var newOverall = calculate(homeworkAvg, exam1, exam2, final);
            finalGrade.textContent = "Overall score: " + (newOverall.total * 100).toFixed(2);
            finalGradeLetter.textContent = "Letter grade: " + newOverall.letter;
        }

        function onChange(i, score, entry) {
            var normalizedScore = score / 100;
            if (normalizedScore > 1 || normalizedScore < 0) {
                throw new Error("Impossible normalized score " + normalizedScore + " " + score);
            }

            if (entry.type === "homework") {
                homeworkValues[i] = normalizedScore;
            } else if (entry.type == "exam1") {
                exam1 = normalizedScore;
            } else if (entry.type == "exam2") {
                exam2 = normalizedScore;
            } else if (entry.type == "final") {
                final = normalizedScore;
            }

            recalculate();
        }

        for (var i = 0; i < data.graded.length; i++) {
            var entry = data.graded[i];
            var label = document.createElement("label");
            label.textContent = entry.value;
            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(document.createElement("br"));
        }

        for (var i = 0; i < data.ungraded.length; i++) {
            (function(i) {
                var entry = data.ungraded[i];
                var sliderWrapper = document.createElement("div");
                sliderWrapper.setAttribute("id", "focs-grade-calculator-tampermonkey-homework-slider-wrapper-" + entry.name);

                var sliderName = "focs-grade-calculator-tampermonkey-homework-slider-" + entry.name;


                var sliderLabel = document.createElement("label");
                sliderLabel.setAttribute("for", sliderName);
                sliderLabel.textContent = entry.name + " percentage:";
                var sliderVal = document.createElement("input");
                sliderVal.setAttribute("type", "text");
                sliderVal.setAttribute("style", "width: 40px");
                sliderVal.value = entry.default * 100;

                var slider = document.createElement("input");
                slider.setAttribute("type", "range");
                slider.setAttribute("min", "0");
                slider.setAttribute("max", "100");
                slider.setAttribute("name", sliderName);
                slider.value = entry.default * 100;
                slider.addEventListener('input', function() {
                    var score = slider.value;
                    sliderVal.value = score;
                    onChange(i, score, entry);
                });

                sliderVal.addEventListener('input', function() {
                    var score = sliderVal.value;
                    slider.value = score;
                    onChange(i, score, entry);
                })

                if (entry.type == "homework") {
                    homeworkValues.push(entry.default);
                }

                sliderWrapper.appendChild(sliderLabel);
                sliderWrapper.appendChild(sliderVal);
                sliderWrapper.appendChild(slider);

                wrapperDiv.appendChild(sliderWrapper);
            })(i);
        }

        wrapperDiv.appendChild(finalGrade);
        wrapperDiv.appendChild(finalGradeLetter);
        section.appendChild(wrapperDiv);

        recalculate();
    }

    var assignments = document.querySelectorAll("tbody tr");
    var homeworkTotal = 0;
    var numHomeworks = 0;
    var exam1 = -1;
    var exam2 = -1;
    var final = -1;

    var graded = [];

    for (var i = 0; i < assignments.length; i++) {
        var assignment = assignments[i];
        var name = assignment.querySelector(".table--primaryLink").textContent;
        var scoreElem = assignment.querySelector(".submissionStatus--score");
        var score = (scoreElem ? scoreElem.textContent : "");
        var scoreFrac = "<No Score>";

        if (score !== "") {
            var split = score.split("/");
            scoreFrac = parseFloat(split[0]) / parseFloat(split[1]);
            if (name.startsWith("Homework")) {
                homeworkTotal += scoreFrac;
                numHomeworks++;
                graded.push({value: name + " (graded): " + Math.round(scoreFrac * 100)});
            } else if (name.startsWith("Exam 1")) {
                exam1 = scoreFrac;
                graded.push({value: "Exam 1: (graded): " + Math.round(scoreFrac * 100)});
            } else if (name.startsWith("Exam 2")) {
                exam2 = scoreFrac;
                graded.push({value: "Exam 2: (graded): " + Math.round(scoreFrac * 100)});
            }
        }

        console.log("Assignment: " + name);
        console.log("Score: " + scoreFrac);
    }


    var ungraded = [];
    // There are eight homeworks total
    for (var j = numHomeworks + 1; j <= 8; j++) {
        ungraded.push({name: "Homework " + j, type: "homework", min: 0, max: 50, default: .80});
    }

    if (exam1 == -1) {
        console.error("Exam 1 has not been graded! Using score of 80 for exam 1 score!");
        exam1 = 80;
        ungraded.push({name: "Exam 1", type: "exam1", min: 0, max: 100, default: exam1});
    }

    if (exam2 == -1) {
        console.error("Exam 2 has not been graded! Using exam 1 score of " + exam1 + " for exam 2 score");
        exam2 = exam1;
        ungraded.push({name: "Exam 2", type: "exam2", min: 0, max: 100, default: exam2});
    }
    if (final == -1) {
        console.error("Final exam has not been graded! Using exam 2 score of " + exam2 + " for final exam score");
        final = exam2;
        ungraded.push({name: "Final exam", type: "final", min: 0, max: 100, default: final});
    }


    var data = {
        ungraded: ungraded,
        graded: graded,
        homeworkTotal: homeworkTotal,
        numHomeworks: numHomeworks,
        exam1: exam1,
        exam2: exam2,
        final: final
    }

    injectCalculator(data);
})();
