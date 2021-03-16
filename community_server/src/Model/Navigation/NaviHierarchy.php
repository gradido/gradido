<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Navigation;

/**
* Navigation Hierarchy
*
* Meant for the center page navigation, where you want to show the full
* hierarchy of pages, resp. navigation links.
*
* @author Christine Slotty <christine.slotty@software-labor.de>
*/
class NaviHierarchy implements \Countable
{
    private $hierarchy = [];

    public function add($entry)
    {
        array_push($this->hierarchy, $entry);
        return $this;
    }
    public function getHierarchy()
    {
        return $this->hierarchy;
    }
    public function count()
    {
        return count($this->hierarchy);
    }
    public function __toString()
    {
        $html = "<ul class='nav-content-list'>";
        $count = count($this->hierarchy);
        foreach ($this->hierarchy as $i => $e) {
            $html .= $e;
            if ($i < $count - 1) {
                $html .= "<li class='nav-content-separator'>-</li>";
            }
        }
        $html .= "</ul>";
        return $html;
    }
}
