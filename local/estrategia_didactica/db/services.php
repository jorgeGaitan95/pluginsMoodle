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

 $services = array(
   'getcomponentsfromtemplate' => array(
     'functions' => array('local_estrategia_didactica_getcomponents_template',
                          'local_estrategia_didactica_get_templates_for_type',
                          'local_estrategia_didactica_save_activities'), //web service function of this service
     'requiredcapability' => '', //capabilities to access any function of this service
     'restrictedusers' => 0,  //if enabled, the moodle administrador must link some user to this service into the administration
     'enable'=>1, //if enabled, the service can be reachable on a defauld installation
   )
 );

 $functions =array(
   'local_estrategia_didactica_getcomponents_template' => array( //web service function name
     'classname' => 'local_estrategia_didactica_external', // class containing the external function_exists
     'methodname' => 'getcomponentsfromtemplate', // external function name
     'classpath' => 'local/estrategia_didactica/externallib.php', //file containing the class/ esxternal function
     'description' => 'Get components that need the template', // human readble description of the web service dunction
     'type'=> 'read', //databaase rights of the web service function (read, write )
     'ajax' => true,
   ),
   'local_estrategia_didactica_get_templates_for_type' => array( //web service function name
     'classname' => 'local_estrategia_didactica_external', // class containing the external function_exists
     'methodname' => 'getTemplatesForType', // external function name
     'classpath' => 'local/estrategia_didactica/externallib.php', //file containing the class/ esxternal function
     'description' => 'Get templates por tipo', // human readble description of the web service dunction
     'type'=> 'read', //databaase rights of the web service function (read, write )
     'ajax' => true,
   ),
   'local_estrategia_didactica_save_activities' => array( //web service function name
     'classname' => 'local_estrategia_didactica_external', // class containing the external function_exists
     'methodname' => 'saveActivities', // external function name
     'classpath' => 'local/estrategia_didactica/externallib.php', //file containing the class/ esxternal function
     'description' => 'Save Activties', // human readble description of the web service dunction
     'type'=> 'write', //databaase rights of the web service function (read, write )
     'ajax' => true,
   ),
 );
