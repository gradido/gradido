<template>
<div>
         <b-collapse  :id="'a' + date + ''" class="pb-4">
          <div style="border: 0px; background-color: #f1f1f1" class="p-2 pb-4 mb-4">
            <!-- Überschrift -->
            <b-row class="gdt-list-clooaps-header-text text-center pb-3">
              <div class="col h4"  >
                {{ $t('gdt.conversion-gdt-euro') }}
              </div>
              <div class="col h4"  >
                {{ $t('gdt.publisher') }}
              </div>
              <div class="col h4"  >{{ $t('gdt.calculation') }}</div>
            </b-row>
 
          </div>
        </b-collapse>
</div>
</template>