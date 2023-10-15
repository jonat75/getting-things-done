import {configureStore, createSlice, ThunkAction} from '@reduxjs/toolkit'


describe("retrieveUnclassifiedTodos", () => {

    const initialState = {
        todos: [],
    }

    type RootState = typeof initialState;

    const UnclassifiedTodosSlice = createSlice({
        name: 'unclassifiedTodos',
        initialState,
        reducers: {
            unclassifiedTodosListed: (state: RootState, action) => {
                state.todos = action.payload;
            },
        }
    })

    interface TodosGateway {
        retrieve(): Promise<string[]>;
    }

    class InMemoryTodosGateway implements TodosGateway {
        constructor(private todos: string[] = []) {
        }

        retrieve(): Promise<string[]> {
            return Promise.resolve(this.todos)
        }

        feedWith(...todos: string[]) {
            this.todos = todos;
        }
    }

    interface Dependencies {
        todosGateway: TodosGateway
    }

    const todosGateway = new InMemoryTodosGateway();

    const {unclassifiedTodosListed} = UnclassifiedTodosSlice.actions
    const reducer = UnclassifiedTodosSlice.reducer;
    const store = configureStore({
        reducer,
        preloadedState: initialState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: {todosGateway},
                },
                serializableCheck: false,
            }),
    })

    const retrieveUnclassifiedTodos =
        (): ThunkAction<void, RootState, Dependencies, any> =>
            async (dispatch, getState, {todosGateway}) => {
                const todos = await todosGateway.retrieve();
                dispatch(
                    unclassifiedTodosListed(todos)
                )
            }

    it('should retrieve empty list', async () => {
        await store.dispatch(retrieveUnclassifiedTodos())
        expect(store.getState().todos).toEqual([])
    })

    it('should retrieve one todo', async () => {
        todosGateway.feedWith('firstTodo')
        await store.dispatch(retrieveUnclassifiedTodos())
        expect(store.getState().todos).toEqual(['firstTodo'])
    })
})