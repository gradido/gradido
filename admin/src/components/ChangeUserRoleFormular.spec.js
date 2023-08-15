import { mount } from '@vue/test-utils'
import ChangeUserRoleFormular from './ChangeUserRoleFormular'
import { setUserRole } from '../graphql/setUserRole'
import { toastSuccessSpy, toastErrorSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue({
  data: {
    setUserRole: null,
  },
})

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    mutate: apolloMutateMock,
  },
  $store: {
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
        roles: ['ADMIN'],
      },
    },
  },
}

let propsData
let wrapper
let spy

describe('ChangeUserRoleFormular', () => {
  const Wrapper = () => {
    return mount(ChangeUserRoleFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('DOM has', () => {
      beforeEach(() => {
        propsData = {
          item: {
            userId: 1,
            roles: [],
          },
        }
        wrapper = Wrapper()
      })

      it('has a DIV element with the class.delete-user-formular', () => {
        expect(wrapper.find('.change-user-role-formular').exists()).toBe(true)
      })
    })

    describe('change own role', () => {
      beforeEach(() => {
        propsData = {
          item: {
            userId: 0,
            roles: ['ADMIN'],
          },
        }
        wrapper = Wrapper()
      })

      it('has the text that you cannot change own role', () => {
        expect(wrapper.text()).toContain('userRole.notChangeYourSelf')
      })

      it('has no role select', () => {
        expect(wrapper.find('select.role-select').exists()).toBe(false)
      })

      it('has no button', () => {
        expect(wrapper.find('button.btn.btn-dange').exists()).toBe(false)
      })
    })

    describe("change other user's role", () => {
      let rolesToSelect

      describe('general', () => {
        beforeEach(() => {
          propsData = {
            item: {
              userId: 1,
              roles: [],
            },
          }
          wrapper = Wrapper()
          rolesToSelect = wrapper.find('select.role-select').findAll('option')
        })

        it('has no text that you cannot change own role', () => {
          expect(wrapper.text()).not.toContain('userRole.notChangeYourSelf')
        })

        it('has the select label', () => {
          expect(wrapper.text()).toContain('userRole.selectLabel')
        })

        it('has a select', () => {
          expect(wrapper.find('select.role-select').exists()).toBe(true)
        })

        it('has role select enabled', () => {
          expect(wrapper.find('select.role-select[disabled="disabled"]').exists()).toBe(false)
        })

        it('has "change_user_role" button', () => {
          expect(wrapper.find('button.btn.btn-danger').text()).toBe('change_user_role')
        })
      })

      describe('user has role "usual user"', () => {
        beforeEach(() => {
          apolloMutateMock.mockResolvedValue({
            data: {
              setUserRole: 'ADMIN',
            },
          })
          propsData = {
            item: {
              userId: 1,
              roles: ['USER'],
            },
          }
          wrapper = Wrapper()
          rolesToSelect = wrapper.find('select.role-select').findAll('option')
        })

        it('has selected option set to "usual user"', () => {
          expect(wrapper.find('select.role-select').element.value).toBe('USER')
        })

        describe('change select to', () => {
          describe('same role', () => {
            it('has "change_user_role" button disabled', () => {
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(true)
            })

            it('does not call the API', () => {
              rolesToSelect.at(0).setSelected()
              expect(apolloMutateMock).not.toHaveBeenCalled()
            })
          })

          describe('new role "MODERATOR"', () => {
            beforeEach(() => {
              rolesToSelect.at(1).setSelected()
            })

            it('has "change_user_role" button enabled', () => {
              expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
                false,
              )
            })

            describe('clicking the "change_user_role" button', () => {
              beforeEach(async () => {
                spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                spy.mockImplementation(() => Promise.resolve(true))
                await wrapper.find('button').trigger('click')
                await wrapper.vm.$nextTick()
              })

              it('calls the modal', () => {
                expect(wrapper.emitted('showModal'))
                expect(spy).toHaveBeenCalled()
              })

              describe('confirm role change with success', () => {
                it('calls the API', () => {
                  expect(apolloMutateMock).toBeCalledWith(
                    expect.objectContaining({
                      mutation: setUserRole,
                      variables: {
                        userId: 1,
                        role: 'MODERATOR',
                      },
                    }),
                  )
                })

                it('emits "updateRoles" with role moderator', () => {
                  expect(wrapper.emitted('updateRoles')).toEqual(
                    expect.arrayContaining([
                      expect.arrayContaining([
                        {
                          userId: 1,
                          roles: ['MODERATOR'],
                        },
                      ]),
                    ]),
                  )
                })

                it('toasts success message', () => {
                  expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
                })
              })

              describe('confirm role change with error', () => {
                beforeEach(async () => {
                  spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                  apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
                  await wrapper.find('button').trigger('click')
                  await wrapper.vm.$nextTick()
                })

                it('toasts an error message', () => {
                  expect(toastErrorSpy).toBeCalledWith('Oh no!')
                })
              })
            })
          })

          describe('new role "ADMIN"', () => {
            beforeEach(() => {
              rolesToSelect.at(2).setSelected()
            })

            it('has "change_user_role" button enabled', () => {
              expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
                false,
              )
            })

            describe('clicking the "change_user_role" button', () => {
              beforeEach(async () => {
                spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                spy.mockImplementation(() => Promise.resolve(true))
                await wrapper.find('button').trigger('click')
                await wrapper.vm.$nextTick()
              })

              it('calls the modal', () => {
                expect(wrapper.emitted('showModal'))
                expect(spy).toHaveBeenCalled()
              })

              describe('confirm role change with success', () => {
                it('calls the API', () => {
                  expect(apolloMutateMock).toBeCalledWith(
                    expect.objectContaining({
                      mutation: setUserRole,
                      variables: {
                        userId: 1,
                        role: 'ADMIN',
                      },
                    }),
                  )
                })

                it('emits "updateRoles" with role moderator', () => {
                  expect(wrapper.emitted('updateRoles')).toEqual(
                    expect.arrayContaining([
                      expect.arrayContaining([
                        {
                          userId: 1,
                          roles: ['ADMIN'],
                        },
                      ]),
                    ]),
                  )
                })

                it('toasts success message', () => {
                  expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
                })
              })

              describe('confirm role change with error', () => {
                beforeEach(async () => {
                  spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                  apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
                  await wrapper.find('button').trigger('click')
                  await wrapper.vm.$nextTick()
                })

                it('toasts an error message', () => {
                  expect(toastErrorSpy).toBeCalledWith('Oh no!')
                })
              })
            })
          })
        })
      })

      describe('user has role "moderator"', () => {
        beforeEach(() => {
          apolloMutateMock.mockResolvedValue({
            data: {
              setUserRole: null,
            },
          })
          propsData = {
            item: {
              userId: 1,
              roles: ['MODERATOR'],
            },
          }
          wrapper = Wrapper()
          rolesToSelect = wrapper.find('select.role-select').findAll('option')
        })

        it('has selected option set to "MODERATOR"', () => {
          expect(wrapper.find('select.role-select').element.value).toBe('MODERATOR')
        })

        describe('change select to', () => {
          describe('same role', () => {
            it('has "change_user_role" button disabled', () => {
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(true)
            })

            it('does not call the API', () => {
              rolesToSelect.at(1).setSelected()
              expect(apolloMutateMock).not.toHaveBeenCalled()
            })
          })

          describe('new role "USER"', () => {
            beforeEach(() => {
              rolesToSelect.at(0).setSelected()
            })

            it('has "change_user_role" button enabled', () => {
              expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
                false,
              )
            })

            describe('clicking the "change_user_role" button', () => {
              beforeEach(async () => {
                spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                spy.mockImplementation(() => Promise.resolve(true))
                await wrapper.find('button').trigger('click')
                await wrapper.vm.$nextTick()
              })

              it('calls the modal', () => {
                expect(wrapper.emitted('showModal'))
                expect(spy).toHaveBeenCalled()
              })

              describe('confirm role change with success', () => {
                it('calls the API', () => {
                  expect(apolloMutateMock).toBeCalledWith(
                    expect.objectContaining({
                      mutation: setUserRole,
                      variables: {
                        userId: 1,
                        role: 'USER',
                      },
                    }),
                  )
                })

                it('emits "updateRoles"', () => {
                  expect(wrapper.emitted('updateRoles')).toEqual(
                    expect.arrayContaining([
                      expect.arrayContaining([
                        {
                          userId: 1,
                          roles: [],
                        },
                      ]),
                    ]),
                  )
                })

                it('toasts success message', () => {
                  expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
                })
              })

              describe('confirm role change with error', () => {
                beforeEach(async () => {
                  spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                  apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
                  await wrapper.find('button').trigger('click')
                  await wrapper.vm.$nextTick()
                })

                it('toasts an error message', () => {
                  expect(toastErrorSpy).toBeCalledWith('Oh no!')
                })
              })
            })
          })

          describe('new role "ADMIN"', () => {
            beforeEach(() => {
              rolesToSelect.at(2).setSelected()
            })

            it('has "change_user_role" button enabled', () => {
              expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
                false,
              )
            })

            describe('clicking the "change_user_role" button', () => {
              beforeEach(async () => {
                spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                spy.mockImplementation(() => Promise.resolve(true))
                await wrapper.find('button').trigger('click')
                await wrapper.vm.$nextTick()
              })

              it('calls the modal', () => {
                expect(wrapper.emitted('showModal'))
                expect(spy).toHaveBeenCalled()
              })

              describe('confirm role change with success', () => {
                it('calls the API', () => {
                  expect(apolloMutateMock).toBeCalledWith(
                    expect.objectContaining({
                      mutation: setUserRole,
                      variables: {
                        userId: 1,
                        role: 'ADMIN',
                      },
                    }),
                  )
                })

                it('emits "updateRoles"', () => {
                  expect(wrapper.emitted('updateRoles')).toEqual(
                    expect.arrayContaining([
                      expect.arrayContaining([
                        {
                          userId: 1,
                          roles: ['ADMIN'],
                        },
                      ]),
                    ]),
                  )
                })

                it('toasts success message', () => {
                  expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
                })
              })

              describe('confirm role change with error', () => {
                beforeEach(async () => {
                  spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                  apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
                  await wrapper.find('button').trigger('click')
                  await wrapper.vm.$nextTick()
                })

                it('toasts an error message', () => {
                  expect(toastErrorSpy).toBeCalledWith('Oh no!')
                })
              })
            })
          })
        })
      })

      describe('user has role "admin"', () => {
        beforeEach(() => {
          apolloMutateMock.mockResolvedValue({
            data: {
              setUserRole: null,
            },
          })
          propsData = {
            item: {
              userId: 1,
              roles: ['ADMIN'],
            },
          }
          wrapper = Wrapper()
          rolesToSelect = wrapper.find('select.role-select').findAll('option')
        })

        it('has selected option set to "admin"', () => {
          expect(wrapper.find('select.role-select').element.value).toBe('ADMIN')
        })

        describe('change select to', () => {
          describe('same role', () => {
            it('has "change_user_role" button disabled', () => {
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(true)
            })

            it('does not call the API', () => {
              rolesToSelect.at(1).setSelected()
              // TODO: Fix this
              expect(apolloMutateMock).not.toHaveBeenCalled()
            })
          })

          describe('new role "USER"', () => {
            beforeEach(() => {
              rolesToSelect.at(0).setSelected()
            })

            it('has "change_user_role" button enabled', () => {
              expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
                false,
              )
            })

            describe('clicking the "change_user_role" button', () => {
              beforeEach(async () => {
                spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                spy.mockImplementation(() => Promise.resolve(true))
                await wrapper.find('button').trigger('click')
                await wrapper.vm.$nextTick()
              })

              it('calls the modal', () => {
                expect(wrapper.emitted('showModal'))
                expect(spy).toHaveBeenCalled()
              })

              describe('confirm role change with success', () => {
                it('calls the API', () => {
                  expect(apolloMutateMock).toBeCalledWith(
                    expect.objectContaining({
                      mutation: setUserRole,
                      variables: {
                        userId: 1,
                        role: 'USER',
                      },
                    }),
                  )
                })

                it('emits "updateRoles"', () => {
                  expect(wrapper.emitted('updateRoles')).toEqual(
                    expect.arrayContaining([
                      expect.arrayContaining([
                        {
                          userId: 1,
                          roles: [],
                        },
                      ]),
                    ]),
                  )
                })

                it('toasts success message', () => {
                  expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
                })
              })

              describe('confirm role change with error', () => {
                beforeEach(async () => {
                  spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                  apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
                  await wrapper.find('button').trigger('click')
                  await wrapper.vm.$nextTick()
                })

                it('toasts an error message', () => {
                  expect(toastErrorSpy).toBeCalledWith('Oh no!')
                })
              })
            })
          })

          describe('new role "MODERATOR"', () => {
            beforeEach(() => {
              rolesToSelect.at(1).setSelected()
            })

            it('has "change_user_role" button enabled', () => {
              expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
              expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
                false,
              )
            })

            describe('clicking the "change_user_role" button', () => {
              beforeEach(async () => {
                spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                spy.mockImplementation(() => Promise.resolve(true))
                await wrapper.find('button').trigger('click')
                await wrapper.vm.$nextTick()
              })

              it('calls the modal', () => {
                expect(wrapper.emitted('showModal'))
                expect(spy).toHaveBeenCalled()
              })

              describe('confirm role change with success', () => {
                it('calls the API', () => {
                  expect(apolloMutateMock).toBeCalledWith(
                    expect.objectContaining({
                      mutation: setUserRole,
                      variables: {
                        userId: 1,
                        role: 'MODERATOR',
                      },
                    }),
                  )
                })

                it('emits "updateRoles"', () => {
                  expect(wrapper.emitted('updateRoles')).toEqual(
                    expect.arrayContaining([
                      expect.arrayContaining([
                        {
                          userId: 1,
                          roles: ['MODERATOR'],
                        },
                      ]),
                    ]),
                  )
                })

                it('toasts success message', () => {
                  expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
                })
              })

              describe('confirm role change with error', () => {
                beforeEach(async () => {
                  spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
                  apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
                  await wrapper.find('button').trigger('click')
                  await wrapper.vm.$nextTick()
                })

                it('toasts an error message', () => {
                  expect(toastErrorSpy).toBeCalledWith('Oh no!')
                })
              })
            })
          })
        })
      })
    })

    describe('authenticated user is MODERATOR', () => {
      beforeEach(() => {
        mocks.$store.state.moderator.roles = ['MODERATOR']
      })

      it('displays text with role', () => {
        expect(wrapper.text()).toBe('userRole.selectRoles.admin')
      })

      it('has no role select', () => {
        expect(wrapper.find('select.role-select').exists()).toBe(false)
      })

      it('has no button', () => {
        expect(wrapper.find('button.btn.btn-dange').exists()).toBe(false)
      })
    })
  })
})
