<?php
// Prevent direct access to this file
if (count(get_included_files()) === 1) {
    http_response_code(403);
    exit("Direct access not allowed");
}

// Coordinates mapping for Sri Lanka's 25 districts (district name -> [lat, lng])
if (!defined('DISTRICT_COORDINATES')) {
    define('DISTRICT_COORDINATES', [
        'Colombo'      => [6.9271, 79.8612],
        'Gampaha'      => [7.0873, 79.9926],
        'Kalutara'     => [6.5854, 79.9607],
        'Kandy'        => [7.2906, 80.6337],
        'Matale'       => [7.4684, 80.6234],
        'Nuwara Eliya' => [6.9497, 80.7891],
        'Galle'        => [6.0535, 80.2210],
        'Matara'       => [5.9549, 80.5550],
        'Hambantota'   => [6.1248, 81.1185],
        'Jaffna'       => [9.6615, 80.0255],
        'Kilinochchi'  => [9.3803, 80.3982],
        'Mannar'       => [8.9810, 79.9044],
        'Vavuniya'     => [8.7542, 80.4982],
        'Mullaitivu'   => [9.2673, 80.8143],
        'Batticaloa'   => [7.7170, 81.7000],
        'Ampara'       => [7.2955, 81.6747],
        'Trincomalee'  => [8.5874, 81.2152],
        'Kurunegala'   => [7.4863, 80.3647],
        'Puttalam'     => [8.0330, 79.8270],
        'Anuradhapura' => [8.3114, 80.4037],
        'Polonnaruwa'  => [7.9397, 81.0006],
        'Badulla'      => [6.9934, 81.0550],
        'Moneragala'   => [6.8724, 81.3507],
        'Ratnapura'    => [6.6828, 80.3992],
        'Kegalle'      => [7.2513, 80.3464]
    ]);
}
?>
