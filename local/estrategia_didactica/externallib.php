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

require_once("$CFG->libdir/externallib.php");

class local_estrategia_didactica_external extends external_api {
  /**
  *Returns description of method parameters
  *@return external_function_parameters
  */
  public static function getcomponentsfromtemplate_parameters(){
    return new external_function_parameters(
      array('idtemplate' => new external_value(PARAM_INT,'template id to query the conponents to it'))
    );
  }

  /**
  * The function itself
  * @return string welcome message
  */

  public static function getcomponentsfromtemplate($idtemplate){
    global $DB;
    //Parameters validation
    $params = self::validate_parameters(self::getcomponentsfromtemplate_parameters(),
              array('idtemplate'=>$idtemplate));

    $components = array();

    $components=$DB->get_records_sql('SELECT type_comp.id, type_comp.name FROM {template_components} as temp_comp
        INNER JOIN {type_components} as type_comp on temp_comp.typecomponentsid = type_comp.id
        where temp_comp.templateid = ?',array($idtemplate));

    return $components;
  }

  public static function getcomponentsfromtemplate_returns(){
    return new external_multiple_structure (
        new external_single_structure(
            array(
              'id' => new external_value(PARAM_INT, 'id del componente'),
              'name' => new external_value(PARAM_TEXT, ' nombre del compoennte'),
            )
          )
    );
  }

  /**
  *Returns description of method parameters
  *@return external_function_parameters
  */
  public static function getTemplatesForType_parameters(){
    return new external_function_parameters(
      array('tipoActividad' => new external_value(PARAM_TEXT,'tipo de actividad para determinar las platillas asociadas a la misma'))
    );
  }

  /**
  * The function itself
  * @return string welcome message
  */

  public static function getTemplatesForType($activityType){
    global $DB;
    //Parameters validation
    $params = self::validate_parameters(self::getTemplatesForType_parameters(),
              array('tipoActividad'=>$activityType));

    $templates = array();

    $templates=$DB->get_records_sql('SELECT * FROM {template} as temp
        where temp.activityType = ?',array($activityType));

    return $templates;
  }

  public static function getTemplatesForType_returns(){
    return new external_multiple_structure (
        new external_single_structure(
            array(
              'id' => new external_value(PARAM_INT, 'id del componente'),
              'templatename' => new external_value(PARAM_TEXT, 'nombre del compoennte'),
              'imageurl' => new external_value(PARAM_TEXT, 'url de la image'),
              'activitytype' => new external_value(PARAM_TEXT, 'tipo de la actividad a la que le pertenece la platilla')
            )
          )
    );
  }


  public static function saveActivities_parameters(){
    return new external_function_parameters(
      array('activities' => new external_multiple_structure(
        new external_single_structure(
          array(
            'educational_strategy_id' => new external_value(PARAM_INT,'id de la estrategia_didactica'),
            'text' => new external_value(PARAM_TEXT,'nombre de la actividad'),
            'description' => new external_value(PARAM_TEXT,'descripcion de la actividad'),
            'activitytype' => new external_value(PARAM_TEXT,'Tipo de la actividad'),
            'fecha_inicio' => new external_value(PARAM_INT,'fecha_inicio de la actividad'),
            'fecha_fin' => new external_value(PARAM_INT,'fecha fin de la actividad'),
            'prev_activityid' => new external_value(PARAM_INT,'id de la actividad anterior'),
            'next_activityid' => new external_value(PARAM_INT,'id de la actividad siguiente'),
            'loc' => new external_value(PARAM_TEXT,'informacion x y de la actividad dentro del diagrama de flujo'),
            )
          )
        ))
    );
  }

  public static function saveActivities($activities){
    global $DB;
    //Parameters validation
    $params = self::validate_parameters(self::saveActivities_parameters(),
              array('activities'=>$activities));

    $templates = array();
    foreach ($params['activities'] as $group) {
            $record1= new stdClass();
            $record1->educational_strategy_id = $group[educational_strategy_id];
            $record1->name = $group[text];
            $record1->description = $group[description];
            $record1->activitytype = $group[activitytype];
            $record1->fecha_inicio = $group[fecha_inicio];
            $record1->fecha_fin = $group[fecha_fin];
            $record1->prev_activityid = $group[prev_activityid];
            $record1->next_activityid = $group[next_activityid];
            $record1->location = $group[loc];
            $activityid= $DB->insert_record('activities', $record1, true);
            $aux = array("id"=>$activityid);
            array_push($templates,$aux);
    }

    return $templates;
  }

  public static function saveActivities_returns(){
    return new external_multiple_structure (
        new external_single_structure(
            array(
              'id' => new external_value(PARAM_INT, 'id del componente')
            )
          )
    );
  }


}
