<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Überweisung'));

?>
<div class="row">
  <div class="col-md-10 equel-grid">
    <div class="grid">
      <p class="grid-header">Überweisen</p>
      <div class="grid-body">
        <div class="item-wrapper">
          <div class="row mb-3">
            <div class="col-md-10 mx-auto">
              <?= $this->Form->create($creationForm) ?>
                <div class="form-group row showcase_row_area">
                  <div class="col-md-3 showcase_text_area">
                    <label for="inputAmount">Betrag in GDD</label>
                  </div>
                  <div class="col-md-9 showcase_content_area">
                    <input type="number" step="0.01" class="form-control" id="inputAmount" name="inputAmount" >
                  </div>
                </div>
                <div class="form-group row showcase_row_area">
                  <div class="col-md-3 showcase_text_area">
                    <label for="inputMemo">Verwendungszweck</label>
                  </div>
                  <div class="col-md-9 showcase_content_area">
                    <textarea class="form-control" id="inputMemo" name="inputMemo" cols="12" rows="5"></textarea>
                  </div>
                </div>
                <div class="form-group row showcase_row_area">
                  <div class="col-md-3 showcase_text_area">
                    <label for="inputReceiver">Empfänger</label>
                  </div>
                  <div class="col-md-9 showcase_content_area">
                    <input type="email" class="form-control" id="inputReceiver" name="inputReceiver" placeholder="E-Mail">
                  </div>
                </div>
                <button type="submit" class="btn btn-sm btn-primary" name="next">Transaktion(n) abschließen</button>
                <button type="submit" class="btn btn-sm" name="add">Weitere Transaktion erstellen</button>
              <?= $this->Form->end() ?>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>