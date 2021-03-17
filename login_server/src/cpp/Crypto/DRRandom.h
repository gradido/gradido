/*/*************************************************************************
 *                                                                         *
 * Core, Core-Lib for my programs, Core doesn't need any libraries	   *
 * Copyright (C) 2012, 2013, 2014 Dario Rekowski                           *
 * Email: ***REMOVED***   Web: ***REMOVED***                *
 *                                                                         *
 * This program is free software: you can redistribute it and/or modify    *
 * it under the terms of the GNU General Public License as published by    *
 * the Free Software Foundation, either version 3 of the License, or       *
 * any later version.                                                      *
 *									   *
 * This program is distributed in the hope that it will be useful,	   *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of	   *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the	   *
 * GNU General Public License for more details.				   *
 *									   *
 * You should have received a copy of the GNU General Public License	   *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                         *
 ***************************************************************************/

/* 
 * File:   DRRandom.h
 * Author: dario
 *
 * Created on 25. August 2011, 13:28
 */

#ifndef __DR_CORE2_RANDOM__
#define	__DR_CORE2_RANDOM__

#include "Poco/Types.h"

class DRRandom
{
public:
    DRRandom() {}
    
    static long core2_rand();
    static double core2_randf();
    static Poco::Int64 r64();
    static double rDouble(double max, double min); 
    static float rReal(float fMax, float fMin)
    {
         return static_cast<float>(rDouble(fMax, fMin));
    }

    static int rInt(int max, int min);

   
    static void seed(long seed); 
    static void seedf(long seed);
private:
};


#endif	/* __DR_CORE2_RANDOM__ */

