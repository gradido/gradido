<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

return [
    // Container element used by control().
    'inputContainer' => '<div class="form-group row showcase_row_area">{{content}}</div>',
    // Label element when inputs are not nested inside the label.
    'label' => '<div class="col-md-3 showcase_text_area">'
              . '<label{{attrs}}>{{text}}</label>'
             . '</div>',
    // Generic input element.
    'input' => '<div class="col-md-9 showcase_content_area">'
              . '<input type="{{type}}" name="{{name}}"{{attrs}}/>'
             . '</div>',
    
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