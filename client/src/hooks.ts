import { useEffect, useState } from 'react'
import { BehaviorSubject } from 'rxjs'

export function useBehaviorSubject<T>(source: BehaviorSubject<T>): T {
    const [value, setValue] = useState(source.getValue())
    useEffect(() => {
        const subscription = source.subscribe(value => setValue(value))
        return () => subscription.unsubscribe()
    }, [source])
    return value
}
