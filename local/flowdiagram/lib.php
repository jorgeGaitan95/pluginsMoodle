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
defined('MOODLE_INTERNAL') || die();
function local_flowdiagram_extend_navigation(global_navigation $navigation) {
$nodeFoo = $navigation->add('Prueba Nav');
$nodeBar = $nodeFoo->add('Flowdiagram',new moodle_url('/local/flowdiagram/index.php'));
}

/**
  *Funcion para obtener las actividades de la estrategia didactica asociada a un estudiante
  * @global object
  * @param int $userid
  * @param int $courseid
  * @return array de actividades pertenecientes a una determianda estrategia didactica. a cada elemento de este array
  * se le agrega una url para permitir la navegacion entre ellas
*/
function get_activities_educational_strategy($educational_strategy_id){
  global $DB;
  return $DB->get_records('activities', array('educational_strategy_id'=>$educational_strategy_id));
}

function get_all_templates(){
  global $DB;
  $templates= array();
  $templates=$DB->get_records('template');
  foreach ($templates as $template) {
    $components=$DB->get_records_sql('SELECT type_comp.id, type_comp.name FROM {template_components} as temp_comp
        INNER JOIN {type_components} as type_comp on temp_comp.typecomponentsid = type_comp.id
        where temp_comp.templateid = ?',array($template->id));
    if($components){
        $template->components=$components;
    }

  }
  return $templates;
}
