<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

return [
    'inputContainer' => '{{content}}',
    'input' => '<div class="input-group showcase_row_area">'
              . '<input type="{{type}}" class="form-control" name="{{name}}"{{attrs}}/>'
             . '</div>',
    'error' => '<div class="input-group showcase_content_area invalid-feedback">'
              . '{{content}}'
             . '</div>',

    // Container for error items.
    //'errorList' => '<ul>{{content}}</ul>',
    'errorList' => '{{content}}',

    // Error item wrapper.
    //'errorItem' => '<li>{{text}}</li>',
    'errorItem' => '<div>{{text}}</div>'
];
