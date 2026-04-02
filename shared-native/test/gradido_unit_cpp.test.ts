
import { GradidoUnit } from '../cpp.cjs'
import { testGradidoUnit } from './unit.test'

testGradidoUnit('GradidoUnit C++', (amount) => new GradidoUnit(amount))
