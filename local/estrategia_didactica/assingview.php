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
    require_once($CFG->dirroot . '/mod/assign/locallib.php');
    $id=optional_param('id',0, PARAM_INT);
    $assignid = optional_param('assignid',0, PARAM_INT);
    $activityid= optional_param('activityid', 0, PARAM_INT);
    $action=optional_param('action', '', PARAM_ALPHA);
    if($assignid){
      if (! $assign = $DB->get_record("assign", array("id" => $assignid))) {
          print_error('invalidforumid', 'forum');
      }
      if (! $course = $DB->get_record("course", array("id" => $assign->course))) {
          print_error('coursemisconf');
      }
      if (! $cm = $DB->get_record("course_modules", array("course" => $course->id,"module"=>1,"instance"=>$assignid))) {
          print_error('invalidcoursemodule');
      }
      $coursecontext = context_course::instance($course->id);
      require_login($course);
    }else if ($id){
      list ($course, $cm) = get_course_and_cm_from_cmid($id, 'assign');
      if (! $assignrecord = $DB->get_record("assign", array("id" => $cm->instance))) {
          print_error('invalidassignid', 'assign');
      }
      $activityid=get_activityid($assignrecord->id);
      $coursecontext = context_course::instance($course->id);
      require_login($course);
    }else {
      print_error('missingparameter');
    }
    $context = context_module::instance($cm->id);
    $actividades = getActivities($USER->id,$course->id,$activityid);
    require_capability('mod/assign:view', $coursecontext);
    //UTILIZACION DEL RRENDER ASSIGN_HEADER DEL RENDERER MOD/ASSIGN,  renderiza solo el header y la descripcion
    // de latarea
    /*$header = new assign_header($assign,
                                $context,
                                true,
                                $cm->id,
                                '','','');
    $o .= get_renderer()->render($header);
    echo $o;*/
    $assign = new assign($context, $cm, $course);
    $urlparams = array('assignid' => $assignid,
                      'action' => optional_param('action', '', PARAM_ALPHA),
                      'rownum' => optional_param('rownum', 0, PARAM_INT),
                      'useridlistid' => optional_param('useridlistid', $assign->get_useridlist_key_id(), PARAM_ALPHANUM));
    $url = new moodle_url('/local/estrategia_didactica/assignview.php', $urlparams);
    $PAGE->set_url($url);
    $PAGE->set_context($coursecontext);
    $PAGE->set_title('Estrategia Didactica');
    $PAGE->set_pagelayout('course');
    $PAGE->navbar->add('Estrategia Didactica');
    $PAGE->requires->css(new moodle_url('/local/estrategia_didactica/style/style.css'),true);
    // Update module completion status.
    $assign->set_module_viewed();
    // Apply overrides.
    $assign->update_effective_access($USER->id);
    // Get the assign class to
    // render the page.
    //echo $assign->view(optional_param('action', '', PARAM_ALPHA));
    $output =$PAGE->get_renderer('mod_assign');
    //$assignrecord = $DB->get_record("assign", array("id" => $assignid));
    $assignwidget = new assign_header($assign->get_instance(),$context,true,$cm->id,'','','');
    //Mostar solo un elemento especifico del render del mod/assign
    //echo $output->header();
    $datatemplate= $assignwidget->export_for_template($output);
    $data=(object)array();
    $data->activities=$actividades;
    $data->tarea=$datatemplate;
    $PAGE->set_heading($course->fullname);
    $showedit = ($assign->is_any_submission_plugin_enabled()) &&
                $assign->can_edit_submission($USER->id);
    $submission = $assign->get_user_submission($USER->id, false);
    $assigncoursemoduleid=$assign->get_course_module()->id;
    $o='';
    if ($showedit) {
      if (!$submission || $submission->status == ASSIGN_SUBMISSION_STATUS_NEW) {
          $o .= $OUTPUT->box_start('generalbox submissionaction');
          $urlparams = array('id' => $assigncoursemoduleid,'activityid' =>$activityid, 'action' => 'editsubmission');
          $o .= $OUTPUT->single_button(new moodle_url('/local/estrategia_didactica/assingview.php', $urlparams),
                               get_string('addsubmission', 'assign'), 'get');
          $o .= $OUTPUT->box_start('boxaligncenter submithelp');
          $o .= get_string('editsubmission_help', 'assign');
          $o .= $OUTPUT->box_end();
          $o .= $OUTPUT->box_end();
        } else if ($submission->status == ASSIGN_SUBMISSION_STATUS_REOPENED) {
          $o .= $OUTPUT->box_start('generalbox submissionaction');
          $urlparams = array('id' => $assigncoursemoduleid,'activityid' =>$activityid,
                             'action' => 'editprevioussubmission',
                             'sesskey'=>sesskey());
          $o .= $OUTPUT->single_button(new moodle_url('/local/estrategia_didactica/assingview.php', $urlparams),
                                             get_string('addnewattemptfromprevious', 'assign'), 'get');
          $o .= $OUTPUT->box_start('boxaligncenter submithelp');
          $o .= get_string('addnewattemptfromprevious_help', 'assign');
          $o .= $OUTPUT->box_end();
          $o .= $OUTPUT->box_end();
          $o .= $OUTPUT->box_start('generalbox submissionaction');
          $urlparams = array('id' => $assigncoursemoduleid, 'action' => 'editsubmission');
          $o .= $OUTPUT->single_button(new moodle_url('/local/estrategia_didactica/assingview.php', $urlparams),
                                               get_string('addnewattempt', 'assign'), 'get');
          $o .= $OUTPUT->box_start('boxaligncenter submithelp');
          $o .= get_string('addnewattempt_help', 'assign');
          $o .= $OUTPUT->box_end();
          $o .= $OUTPUT->box_end();
        } else {
          $o .= $OUTPUT->box_start('generalbox submissionaction');
          $urlparams = array('id' => $assigncoursemoduleid,'activityid' =>$activityid, 'action' => 'editsubmission');
          $o .= $OUTPUT->single_button(new moodle_url('/local/estrategia_didactica/assingview.php', $urlparams),
                                             get_string('editsubmission', 'assign'), 'get');
          $o .= $OUTPUT->box_start('boxaligncenter submithelp');
          $o .= get_string('editsubmission_help', 'assign');
          $o .= $OUTPUT->box_end();
          $o .= $OUTPUT->box_end();
        }
      }
    echo $OUTPUT->header();
    echo $OUTPUT->render_from_template('local_estrategia_didactica/tarea',$data);
    $nextpageparams = array();
    $nextpageparams['id'] = $assigncoursemoduleid;
    $nextpageparams['activityid']=$activityid;

    if ($action == 'savesubmission') {
      $action = 'editsubmission';
      if (process_save_submission($mform, $notices,$assign)) {
          $action = 'redirect';
          $nextpageparams['action'] = 'view';
      }
    }else if ($action &&$action == 'editsubmission'){
      $mform = null;
      $notices = array();
      echo view_assign_form($mform,$notices,$assign);

    }else{
      echo $assign->view_student_summary($USER,false);
      echo $o;
    }
    if ($action == 'redirect') {
        $nextpageurl = new moodle_url('/local/estrategia_didactica/assingview.php', $nextpageparams);
        redirect($nextpageurl);
        return;
    }
    echo $OUTPUT->footer();
    /*$output= $PAGE->get_renderer('local_estrategia_didactica');
    echo $output->header();
    echo $output->heading();*/
