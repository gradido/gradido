<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Navigation;

use Cake\Routing\Router;

class NaviEntryExternLink extends NaviEntryAbsoluteLink {
 
    protected function link() {
        //global $self;
        //echo "<i>self: </i>"; var_dump($GLOBALS("self"));
        $self = $GLOBALS["self"];
        
          return '<a href="'.$this->link.'" class="' .$this->bgColorClass .'" target="_blank">'
                  . '<span class="link-title">' . $this->title . '</span>'
                  . '<i class="mdi '. $this->iconClass .' link-icon ' . $this->iconColor .'"></i>'
                . '</a>';
        
    }    
}