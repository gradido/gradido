<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Navigation;

class NaviEntryBase {
    protected $title = "";
    protected $childs = [];
    protected $isChild = false;
    
    public function setTitle($title) {
        $this->title = $title;
        return $this;
    }
    
    public function add($child) {
        $child->isChild = true;
        array_push($this->childs, $child);
        return $this;
    }
    
    protected function hasChilds() {
        return count($this->childs) > 0;
    }
    
}
