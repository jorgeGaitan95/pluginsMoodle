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
 $attemptid = required_param('attempt', PARAM_INT); // The attempt to summarise.

 $PAGE->set_url('/local/estrategia_didactica/summary.php', array('attempt' => $attemptid));

 $activityid= optional_param('activityid', 0, PARAM_INT);
 $attemptobj = quiz_attempt::create($attemptid);
 $courseid=$attemptobj->get_courseid();
 $coursecontext = context_course::instance($courseid);
 $actividades = getActivities($USER->id,$courseid,$activityid);
 $attemptobj->set_processattempt_url('/local/estrategia_didactica/processattempt.php');
 // Check login.
 require_login($attemptobj->get_course(), false, $attemptobj->get_cm());

 // Check that this attempt belongs to this user.
 if ($attemptobj->get_userid() != $USER->id) {
     if ($attemptobj->has_capability('mod/quiz:viewreports')) {
         redirect($attemptobj->review_url(null));
     } else {
         throw new moodle_quiz_exception($attemptobj->get_quizobj(), 'notyourattempt');
     }
 }

 // Check capabilites.
 if (!$attemptobj->is_preview_user()) {
     $attemptobj->require_capability('mod/quiz:attempt');
 }

 if ($attemptobj->is_preview_user()) {
     navigation_node::override_active_url($attemptobj->start_attempt_url());
 }

 // Check access.
 $accessmanager = $attemptobj->get_access_manager(time());
 $accessmanager->setup_attempt_page($PAGE);
 $output = $PAGE->get_renderer('mod_quiz');
 $messages = $accessmanager->prevent_access();
 if (!$attemptobj->is_preview_user() && $messages) {
     print_error('attempterror', 'quiz', $attemptobj->view_url(),
             $output->access_messages($messages));
 }
 if ($accessmanager->is_preflight_check_required($attemptobj->get_attemptid())) {
     redirect($attemptobj->start_attempt_url(null));
 }

 $displayoptions = $attemptobj->get_display_options(false);

 // If the attempt is now overdue, or abandoned, deal with that.
 $attemptobj->handle_if_time_expired(time(), true);

 // If the attempt is already closed, redirect them to the review page.
 if ($attemptobj->is_finished()) {
     redirect($attemptobj->review_url());
 }

 // Arrange for the navigation to be displayed.
 if (empty($attemptobj->get_quiz()->showblocks)) {
     $PAGE->blocks->show_only_fake_blocks();
 }

 $navbc = $attemptobj->get_navigation_panel($output, 'quiz_attempt_nav_panel', -1);
 $regions = $PAGE->blocks->get_regions();
 $PAGE->blocks->add_fake_block($navbc, reset($regions));

 $PAGE->navbar->add(get_string('summaryofattempt', 'quiz'));
 $PAGE->set_title($attemptobj->get_quiz_name());
 $PAGE->set_heading($attemptobj->get_course()->fullname);

 // Display the page.
 //echo $output->summary_page($attemptobj, $displayoptions,'/local/estrategia_didactica/');
 $PAGE->set_context($coursecontext);
 $PAGE->set_pagelayout('course');
 $PAGE->navbar->add('Estrategia Didactica');
 $PAGE->requires->css(new moodle_url('/local/estrategia_didactica/style/style.css'),true);
 echo $output->header();
 $data=(object)array();
 $data->activities=$actividades;
 echo $output->render_from_template('local_estrategia_didactica/tabs',$data);
 echo $output->heading(format_string($attemptobj->get_quiz_name()));
 echo $output->heading(get_string('summaryofattempt', 'quiz'), 3);
 echo $output->summary_table($attemptobj, $displayoptions);
 //TODO:falta implementar estos metodos;
 //echo $output->summary_page_controls($attemptobj);
 echo quiz_summary_page_controls($attemptobj,$output);
 echo $output->footer();
 // Log this page view.
 $attemptobj->fire_attempt_summary_viewed_event();
