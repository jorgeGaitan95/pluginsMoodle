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

$id = required_param('id', PARAM_INT);
if (!$educational_strategy = $DB->get_record('educational_strategy', array('id' => $id))) {
    print_error('invalidcourseid');
}
$actividades= get_activities_educational_strategy($educational_strategy->id);
$templates= get_all_templates();
//imprime la plantilas obtenidas a través del web service a la base de datos
//print_object($templates);
global $COURSE,$USER;
$coursecontext = context_course::instance($COURSE->id);
require_login($COURSE);
// Setting context for the page.
$PAGE->set_context($coursecontext);
$context = get_context_instance(CONTEXT_COURSE,$COURSE->id);
if ($roles = get_user_roles($context, $USER->id)) {
foreach ($roles as $role) {
  //print_object($role);
}
}
// URL is created and then set for the page navigation.
// Heading, headers, page layout.
$PAGE->requires->css(new moodle_url('/local/flowdiagram/style/style.css'),true);
$PAGE->set_title('Flow Diagram');
$PAGE->set_heading('Flow Diagram Prueba');
$PAGE->set_pagelayout('standard');
echo $OUTPUT->header();
$data=(object)array();
$data->texto="hola mundo";
$data->templates=$templates;
echo $OUTPUT->render_from_template('local_flowdiagram/index',$data);
echo $OUTPUT->footer();
