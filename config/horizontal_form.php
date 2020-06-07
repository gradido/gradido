<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

return [
    // Container element used by control().
    'inputContainer' => '{{content}}',
    // Container element used by control() when a field has an error.
    'inputContainerError' => '<div class="{{type}}{{required}} is-invalid">{{content}}{{error}}</div>',
    // Label element when inputs are not nested inside the label.
    'label' => '<label{{attrs}} class="form-label">{{text}}</label>',
    // Generic input element.
    'input' => '<input type="{{type}}" class="form-control" name="{{name}}"{{attrs}}/>',
    // Textarea input element,
    'textarea' => '<textarea class="form-control" name="{{name}}"{{attrs}}>{{value}}</textarea>',
    // Error message wrapper elements.
    'error' => '<div class="invalid-feedback">'
              . '{{content}}'
             . '</div>',
    // Container for error items.
    'errorList' => '{{content}}',
    // Error item wrapper.
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