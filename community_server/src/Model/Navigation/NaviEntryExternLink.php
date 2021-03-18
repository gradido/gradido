<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace Model\Navigation;

use Cake\Routing\Router;

class NaviEntryExternLink extends NaviEntryAbsoluteLink
{

    protected function link()
    {
        $self = $GLOBALS["self"];

        return '<a href="'.$this->link.'" class="' .$this->bgColorClass .'" target="_blank">'
            .'<i class="material-icons-outlined nav-icon ' . $this->iconColor
            .'" title="' . $this->title . '">'. $this->iconClass .'</i>'
            . '<span class="link-title">' . $this->title . '</span>'
            . '</a>';
    }
}
