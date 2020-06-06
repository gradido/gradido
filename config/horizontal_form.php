<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

return [
    // Container element used by control().
    'inputContainer' => '<div class="form-group row showcase_row_area">{{content}}</div>',
    // Container element used by control() when a field has an error.
    //'inputContainerError' => '<div class="input {{type}}{{required}} error">{{content}}{{error}}</div>',
    'inputContainerError' => '<div class="form-group row showcase_row_area {{type}}{{required}} is-invalid">{{content}}{{error}}</div>',
    // Label element when inputs are not nested inside the label.
    'label' => '<div class="col-md-3 showcase_text_area">'
              . '<label{{attrs}}>{{text}}</label>'
             . '</div>',
    // Generic input element.
    'input' => '<div class="col-md-9 showcase_content_area">'
              . '<input type="{{type}}" class="form-control" name="{{name}}"{{attrs}}/>'
             . '</div>',
    // Textarea input element,
    'textarea' => '<div class="col-md-9 showcase_content_area">'
                  . '<textarea class="form-control" name="{{name}}"{{attrs}}>{{value}}</textarea>'
                . '</div>',
    // Error message wrapper elements.
    //'error' => '<div class="error-message">{{content}}</div>',
    //'error' => '{{content}}',
    'error' => '<div class="col-md-9 offset-md-3 showcase_content_area invalid-feedback">'
              . '{{content}}'
             . '</div>',
    
    // Container for error items.
    //'errorList' => '<ul>{{content}}</ul>',
    'errorList' => '{{content}}',
    
    // Error item wrapper.
    //'errorItem' => '<li>{{text}}</li>',
    'errorItem' => '<div>{{text}}</div>'
];
/*

  <div class="form-group row showcase_row_area">
    <div class="col-md-3 showcase_text_area">
      <label for="inputAmount">Betrag in GDD</label>
    </div>
    <div class="col-md-9 showcase_content_area">
      <input type="number" step="0.01" class="form-control" id="inputAmount" name="inputAmount" >
    </div>
  </div>
 

<div class="input number required">
  <label for="amount">Amount</label>
  <input type="number" name="amount" required="required" step="0.01" id="amount">
</div>
 
 */