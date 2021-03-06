<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
/**
 * Defines the version and other meta-info about the plugin
 *
 * Setting the $plugin->version to 0 prevents the plugin from being installed.
 * See https://docs.moodle.org/dev/version.php for more info.
 *
 * @package    local_flowdiagram
 * @copyright  2017 Jorge Gaitán <jorgegaitan903@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
 require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
 require_once(dirname(__FILE__).'/lib.php');
 require_once($CFG->dirroot . '/mod/quiz/locallib.php');
 // Remember the current time as the time any responses were submitted
 // (so as to make sure students don't get penalized for slow processing on this page).
 $timenow = time();

 // Get submitted parameters.
 $attemptid     = required_param('attempt',  PARAM_INT);
 $thispage      = optional_param('thispage', 0, PARAM_INT);
 $nextpage      = optional_param('nextpage', 0, PARAM_INT);
 $previous      = optional_param('previous',      false, PARAM_BOOL);
 $next          = optional_param('next',          false, PARAM_BOOL);
 $finishattempt = optional_param('finishattempt', false, PARAM_BOOL);
 $timeup        = optional_param('timeup',        0,      PARAM_BOOL); // True if form was submitted by timer.
 $scrollpos     = optional_param('scrollpos',     '',     PARAM_RAW);

 $attemptobj = quiz_attempt::create($attemptid);
 $attemptobj->set_summary_url('/local/estrategia_didactica/summary.php');
 // Set $nexturl now.
 if ($next) {
     $page = $nextpage;
 } else if ($previous && $thispage > 0) {
     $page = $thispage - 1;
 } else {
     $page = $thispage;
 }
 if ($page == -1) {
     $nexturl = $attemptobj->summary_url();
 } else {
     $nexturl = $attemptobj->attempt_url(null, $page);
     if ($scrollpos !== '') {
         $nexturl->param('scrollpos', $scrollpos);
     }
 }

 // Check login.
 require_login($attemptobj->get_course(), false, $attemptobj->get_cm());
 require_sesskey();

 // Check that this attempt belongs to this user.
 if ($attemptobj->get_userid() != $USER->id) {
     throw new moodle_quiz_exception($attemptobj->get_quizobj(), 'notyourattempt');
 }

 // Check capabilities.
 if (!$attemptobj->is_preview_user()) {
     $attemptobj->require_capability('mod/quiz:attempt');
 }

 // If the attempt is already closed, send them to the review page.
 if ($attemptobj->is_finished()) {
     throw new moodle_quiz_exception($attemptobj->get_quizobj(),
             'attemptalreadyclosed', null, $attemptobj->review_url());
 }

 // Process the attempt, getting the new status for the attempt.
 $status = $attemptobj->process_attempt($timenow, $finishattempt, $timeup, $thispage);

 if ($status == quiz_attempt::OVERDUE) {
     redirect($attemptobj->summary_url());
 } else if ($status == quiz_attempt::IN_PROGRESS) {
     redirect($nexturl);
 } else {
     // Attempt abandoned or finished.
     redirect($attemptobj->review_url());
 }
