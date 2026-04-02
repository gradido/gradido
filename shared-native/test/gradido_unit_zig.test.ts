
import { GradidoUnit } from '../lib/GradidoUnit.zigar'
import { testGradidoUnit } from './unit.test'

testGradidoUnit('GradidoUnit Zig', (amount) => new GradidoUnit(amount))
