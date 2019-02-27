// ==UserScript==
// @name         FOCS Grade Calculator
// @namespace    https://aaron1011.pw
// @version      0.2.0
// @description  Calculate your FOCS grade on gradescope
// @author       Aaron1011
// @match        https://www.gradescope.com/courses/35880
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var gradeTable = [[93, "A", "lightgreen"], [90, "A⁻", "#90ee907a"], [87, "B⁺", "yellow"], [83, "B", "#fefe496b"], [80, "B⁻", "lightyellow"], [77, "C⁺", "orange"], [73, "C", "#ffa50078"], [70, "C⁻", "red"], [67, "D⁺", "red"], [60, "D", "red"], [0, "F", "red"]];

    function percentToLetter(percent) {
        percent = Math.round(percent * 100);
        // Each list item is of the form [minimum score, letter grade]
        for (var i = 0; i < gradeTable.length; i++) {
            if (percent >= gradeTable[i][0]) {
                return gradeTable[i][1];
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
        wrapperDiv.style.paddingTop = "20px";
        var title = document.createElement("h2");

        // Add two line breaks
        title.appendChild(document.createElement("br"));
        title.appendChild(document.createElement("br"));

        title.textContent = "FOCS Grade calculator script";

        var formula = document.createElement("p");
        formula.innerHTML = "Formula: ((0.2 * HW) + (.25 * Exam1) + (.25 * Exam2) + (.30 * FinalExam)) [from <a href='https://www.cs.rpi.edu/~pattes3/csci2200/general-info-2019.pdf'>https://www.cs.rpi.edu/~pattes3/csci2200/general-info-2019.pdf</a>]";

        title.appendChild(formula);

        var finalGrade = document.createElement("div");
        var finalGradeLetter = document.createElement("div");
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
            finalGradeLetter.textContent = newOverall.letter;
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

        var outerFlex = document.createElement("div");
        outerFlex.style.display = "flex";
        //outerFlex.style.display = "inline-flex";
        //outerFlex.style.width = "50%";

        var gridWrapper = document.createElement("div");
        //gridWrapper.setAttribute("style", "display: inline-grid; grid-template-columns: max-content max-content 2% max-content; grid-auto-flow: column; grid-auto-columns: 2fr;align-items: center;column-gap: 1%;");

        gridWrapper.style.display = "inline-grid";
        gridWrapper.style.gridTemplateColumns = "repeat(5, auto)";
        gridWrapper.style.border = "1px solid rgba(31,51,51,0.1)";
        gridWrapper.style.gridAutoFlow = "column";
        //gridWrapper.style.flexGrow = 1;
        gridWrapper.style.alignItems = "center";
        //gridWrapper.style.columnGap = "0.1%";
        gridWrapper.style.gridTemplateRows = "repeat(" + Math.max(data.ungraded.length, data.graded.length) + ", 1fr)";

        var vertLine = document.createElement("div");
        //vertLine.style.backgroundColor = "black";
        vertLine.style.gridColumn = 3;
        vertLine.style.gridRow = "1 / end";
        vertLine.style.height = "100%";
        //vertLine.style.width = "5px";
        vertLine.style.borderLeft = "1px solid rgba(31,51,51,0.1)";

        // Pad on both sides of our left border
        vertLine.style.paddingLeft = "5px";
        vertLine.style.marglinLeft = "5px";


        gridWrapper.appendChild(vertLine);

        for (var i = data.graded.length - 1; i >= 0; i--) {
            var entry = data.graded[i];
            var label = document.createElement("label");
            label.textContent = entry.name;
            label.style.gridColumn = 1;

            var score = document.createElement("label");
            score.textContent = entry.value;
            score.style.gridColumn = 2;
            score.style.fontWeight = 'bold';
            //score.style.borderRight = "solid";

            gridWrapper.appendChild(label);
            gridWrapper.append(score);
            //wrapperDiv.appendChild(document.createElement("br"));
        }

        for (var i = 0; i < data.ungraded.length; i++) {
            (function(i) {
                var entry = data.ungraded[i];
                var sliderWrapper = document.createElement("div");
                sliderWrapper.setAttribute("id", "focs-grade-calculator-tampermonkey-homework-slider-wrapper-" + entry.name);
                sliderWrapper.style.display = "inline-block";

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

                sliderLabel.style.gridColumn = 4;
                slider.style.gridColumn = 5;
                sliderVal.style.gridColumn = 6;


                gridWrapper.appendChild(sliderLabel);
                gridWrapper.appendChild(slider);
                gridWrapper.appendChild(sliderVal);
            })(i);
        }

        outerFlex.appendChild(gridWrapper);

        var gradePadding = 48;
        var caretWidth = 30;

        // The upper point of the triangle is the middle of the caret div.
        // Position the triangle so that the point is directly under
        // the start of the grade scale.
        var caretBasePadding = gradePadding - (caretWidth / 2);


        // https://stackoverflow.com/a/37099785/1290530
        var gradeOutputWrapper = document.createElement("div");

        gradeOutputWrapper.style.display = "flex";
        gradeOutputWrapper.style.flexDirection = "column";
        gradeOutputWrapper.style.justifyContent = "center";
        gradeOutputWrapper.style.flex = "auto";
        //gradeOutputWrapper.style.alignItems = "center";

        finalGradeLetter.style.fontSize = "120px";
        finalGradeLetter.style.paddingLeft = gradePadding + "px";



        var gradeScale = document.createElement("div");
        gradeScale.style.display = "flex";
        gradeScale.style.width = "40%";
        gradeScale.style.paddingLeft = gradePadding + "px";
        finalGrade.style.paddingLeft = gradePadding + "px";

        var start = 100;
        for (var j = 0; j < gradeTable.length; j++) {
            var gradeRange = start - gradeTable[j][0];
            var gradeSection = document.createElement("div");
            gradeSection.style.backgroundColor = gradeTable[j][2];
            gradeSection.textContent = gradeTable[j][1];
            gradeSection.style.flexGrow = gradeRange;
            gradeSection.style.textAlign = "center";
            gradeScale.appendChild(gradeSection);
            start = gradeTable[j][0];
        }

        var gradeCaret = document.createElement("div");
        gradeCaret.style.backgroundColor = "blue";
        gradeCaret.style.clipPath = "polygon(50% 0, 0 100%, 100% 100%)";
        gradeCaret.style.width = "30px";
        gradeCaret.style.height = "30px";
        gradeCaret.style.marginLeft = caretBasePadding + "px";


        var gradeScaleWrapper = document.createElement("div");
        gradeScaleWrapper.appendChild(gradeScale);
        gradeScaleWrapper.appendChild(gradeCaret);



        //gradeOutputWrapper.appendChild(finalGrade);
        gradeOutputWrapper.appendChild(finalGradeLetter);
        gradeOutputWrapper.appendChild(finalGrade);
        gradeOutputWrapper.appendChild(gradeScaleWrapper);

        outerFlex.appendChild(gradeOutputWrapper);

        wrapperDiv.appendChild(outerFlex);
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
                graded.push({name: name + " (graded):", value: Math.round(scoreFrac * 100)});
            } else if (name.startsWith("Exam 1")) {
                exam1 = scoreFrac;
                graded.push({name: "Exam 1: (graded):", value: Math.round(scoreFrac * 100)});
            } else if (name.startsWith("Exam 2")) {
                exam2 = scoreFrac;
                graded.push({name: "Exam 2: (graded):", value: Math.round(scoreFrac * 100)});
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


